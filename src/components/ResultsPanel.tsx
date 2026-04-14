import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import type { CalculationResults, HeatExchangerInput } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ResultsPanelProps {
  results: CalculationResults | null;
  input: HeatExchangerInput;
  onExportPDF: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (v: number, digits = 2): string => v.toFixed(digits);

const StatusBadge: React.FC<{ ok: boolean; labelOk?: string; labelFail?: string }> = ({
  ok,
  labelOk = "OK",
  labelFail = "N/A",
}) => (
  <span
    className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${
      ok ? "bg-green-100 text-[#16A34A]" : "bg-red-100 text-[#DC2626]"
    }`}
  >
    {ok ? labelOk : labelFail}
  </span>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results, input, onExportPDF }) => {
  // ---- Placeholder state ----
  if (!results) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-lg bg-white p-10 shadow-sm">
        <div className="text-center text-gray-400">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v2m0 14v2m-7-9H3m18 0h-2m-1.636-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414M17.95 17.95l1.414 1.414M6.05 6.05L4.636 4.636M12 8a4 4 0 100 8 4 4 0 000-8z"
            />
          </svg>
          <p className="text-sm leading-relaxed">
            Configure os par&acirc;metros e clique em &lsquo;Calcular&rsquo; para ver os
            resultados
          </p>
        </div>
      </div>
    );
  }

  const { thermal, hydraulic, mechanical } = results;

  // Water outlet temp: last zone cold-side outlet
  const waterOutletTemp =
    thermal.zones.length > 0
      ? thermal.zones[thermal.zones.length - 1].tempColdOut
      : input.tubeSideFluid.tempIn;

  // Build boundary-point arrays for smooth line rendering
  const tempProfileData: { zone: number; T_hot: number; T_cold: number }[] = [];
  thermal.zones.forEach((z, i) => {
    if (i === 0) {
      tempProfileData.push({ zone: 0, T_hot: z.tempHotIn, T_cold: z.tempColdOut });
    }
    tempProfileData.push({
      zone: i + 1,
      T_hot: z.tempHotOut,
      T_cold: z.tempColdIn,
    });
  });

  const vaporChartData = thermal.zones.map((z, i) => ({
    zone: i,
    vaporFraction: z.vaporFraction,
  }));

  // ---- Render helpers ----
  const sectionHeader = (title: string) => (
    <div className="mb-2 rounded-t-lg bg-[#8B0000] px-4 py-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ================================================================
          1. Summary Cards
          ================================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Q total */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="font-mono text-2xl font-bold text-[#1A1A1A]">
            {fmt(thermal.totalQ, 1)} <span className="text-sm font-normal text-gray-500">kW</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">Carga T&eacute;rmica</p>
        </div>

        {/* U medio */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="font-mono text-2xl font-bold text-[#1A1A1A]">
            {fmt(thermal.averageU, 0)}{" "}
            <span className="text-sm font-normal text-gray-500">W/m&sup2;K</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">U Servi&ccedil;o</p>
          <p className="mt-0.5 font-mono text-sm text-gray-400">
            Limpo: {fmt(thermal.averageUClean, 0)} W/m&sup2;K
          </p>
        </div>

        {/* Area */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="font-mono text-2xl font-bold text-[#1A1A1A]">
            {fmt(thermal.totalArea, 2)} / {fmt(thermal.availableArea, 2)}{" "}
            <span className="text-sm font-normal text-gray-500">m&sup2;</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            &Aacute;rea Requerida / Dispon&iacute;vel
          </p>
        </div>

        {/* Status */}
        <div
          className={`rounded-lg border-2 bg-white p-4 shadow-sm ${
            thermal.isAdequate ? "border-[#16A34A]" : "border-[#DC2626]"
          }`}
        >
          <p
            className={`font-mono text-2xl font-bold ${
              thermal.isAdequate ? "text-[#16A34A]" : "text-[#DC2626]"
            }`}
          >
            {thermal.isAdequate ? "ADEQUADO" : "INADEQUADO"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Sobre-&aacute;rea: {fmt(thermal.overdesignPercent, 1)}%
          </p>
        </div>
      </div>

      {/* ================================================================
          2. Thermal Results Table
          ================================================================ */}
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        {sectionHeader("Resultados T\u00e9rmicos")}
        <table className="w-full text-sm">
          <tbody>
            {[
              ["Carga t\u00e9rmica total Q", fmt(thermal.totalQ, 1), "kW"],
              [
                "Temperatura sa\u00edda \u00e1gua",
                fmt(waterOutletTemp, 2),
                "\u00b0C",
              ],
              ["LMTD global", fmt(thermal.globalLMTD, 2), "\u00b0C"],
              ["Fator Ft", fmt(thermal.Ft, 4), "\u2013"],
              ["LMTD corrigido", fmt(thermal.correctedLMTD, 2), "\u00b0C"],
              [
                "\u00c1rea requerida",
                fmt(thermal.totalArea, 2),
                "m\u00b2",
              ],
              [
                "\u00c1rea dispon\u00edvel",
                fmt(thermal.availableArea, 2),
                "m\u00b2",
              ],
              [
                "Sobre-\u00e1rea",
                fmt(thermal.overdesignPercent, 1),
                "%",
              ],
              ["U m\u00e9dio (servi\u00e7o)", fmt(thermal.averageU, 0), "W/m\u00b2K"],
              ["U m\u00e9dio (limpo)", fmt(thermal.averageUClean, 0), "W/m\u00b2K"],
            ].map(([label, value, unit], idx) => (
              <tr
                key={label}
                className={idx % 2 === 0 ? "bg-white" : "bg-[#F8F8F8]"}
              >
                <td className="px-4 py-1.5 text-[#333333]">{label}</td>
                <td className="px-4 py-1.5 text-right font-mono font-semibold text-[#1A1A1A]">
                  {value}
                </td>
                <td className="px-4 py-1.5 text-xs text-gray-500">{unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================================================================
          3. Zone-by-Zone Profile Table
          ================================================================ */}
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        {sectionHeader("Perfil por Zona")}
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-xs">
            <thead>
              <tr className="bg-[#8B0000] text-white">
                {[
                  "Zona",
                  "T_h,in (\u00b0C)",
                  "T_h,out (\u00b0C)",
                  "T_c,in (\u00b0C)",
                  "T_c,out (\u00b0C)",
                  "x_vapor",
                  "Q (kW)",
                  "LMTD (\u00b0C)",
                  "h_o (W/m\u00b2K)",
                  "h_i (W/m\u00b2K)",
                  "U (W/m\u00b2K)",
                  "A (m\u00b2)",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {thermal.zones.map((z, idx) => (
                <tr
                  key={z.zoneIndex}
                  className={idx % 2 === 0 ? "bg-white" : "bg-[#F8F8F8]"}
                >
                  <td className="px-2 py-1 text-center font-mono">{z.zoneIndex + 1}</td>
                  <td className="px-2 py-1 text-center font-mono">{fmt(z.tempHotIn, 1)}</td>
                  <td className="px-2 py-1 text-center font-mono">{fmt(z.tempHotOut, 1)}</td>
                  <td className="px-2 py-1 text-center font-mono">{fmt(z.tempColdIn, 1)}</td>
                  <td className="px-2 py-1 text-center font-mono">{fmt(z.tempColdOut, 1)}</td>
                  <td className="px-2 py-1 text-center font-mono">{fmt(z.vaporFraction, 3)}</td>
                  <td className="px-2 py-1 text-center font-mono">{fmt(z.Q, 2)}</td>
                  <td className="px-2 py-1 text-center font-mono">{fmt(z.LMTD, 2)}</td>
                  <td className="px-2 py-1 text-center font-mono">{fmt(z.ho, 0)}</td>
                  <td className="px-2 py-1 text-center font-mono">{fmt(z.hi, 0)}</td>
                  <td className="px-2 py-1 text-center font-mono">{fmt(z.U, 0)}</td>
                  <td className="px-2 py-1 text-center font-mono">{fmt(z.areaRequired, 3)}</td>
                </tr>
              ))}
              {/* Footer totals */}
              <tr className="border-t border-gray-300 bg-gray-100 font-semibold">
                <td className="px-2 py-1.5 text-center">Total</td>
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5 text-center font-mono">
                  {fmt(
                    thermal.zones.reduce((s, z) => s + z.Q, 0),
                    2,
                  )}
                </td>
                <td className="px-2 py-1.5 text-center font-mono">
                  {fmt(thermal.globalLMTD, 2)}
                </td>
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5" />
                <td className="px-2 py-1.5 text-center font-mono">
                  {fmt(thermal.averageU, 0)}
                </td>
                <td className="px-2 py-1.5 text-center font-mono">
                  {fmt(thermal.totalArea, 3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================
          4. Temperature Profile Chart
          ================================================================ */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#333333]">
          Perfil de Temperatura ao Longo do Trocador
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tempProfileData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="zone"
              label={{ value: "Zona", position: "insideBottomRight", offset: -5 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              label={{
                value: "Temperatura (\u00b0C)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11 },
              }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value) => `${fmt(Number(value), 1)} \u00b0C`}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="T_hot"
              stroke="#C41230"
              strokeWidth={2}
              name="Lado Quente"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="T_cold"
              stroke="#2563EB"
              strokeWidth={2}
              name="Lado Frio"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ================================================================
          5. Vapor Fraction Chart
          ================================================================ */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#333333]">
          Fra&ccedil;&atilde;o de Vapor ao Longo do Trocador
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={vaporChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="zone"
              label={{ value: "Zona", position: "insideBottomRight", offset: -5 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[0, 1]}
              label={{
                value: "Fra\u00e7\u00e3o de Vapor",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11 },
              }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value) => fmt(Number(value), 3)}
              contentStyle={{ fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="vaporFraction"
              stroke="#C41230"
              fill="#C4123033"
              strokeWidth={2}
              name="Fra\u00e7\u00e3o de Vapor"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ================================================================
          6. Hydraulic Results
          ================================================================ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Tube side */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {sectionHeader("Hidr\u00e1ulico \u2013 Lado Tubos")}
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">Velocidade</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(hydraulic.tubeSide.velocity, 2)} m/s
                  </td>
                </tr>
                <tr className="bg-[#F8F8F8]">
                  <td className="py-1 text-[#333333]">Reynolds</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(hydraulic.tubeSide.reynolds, 0)}
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">&Delta;P calculado</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(hydraulic.tubeSide.pressureDrop, 1)} kPa
                  </td>
                </tr>
                <tr className="bg-[#F8F8F8]">
                  <td className="py-1 text-[#333333]">&Delta;P admiss&iacute;vel</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(hydraulic.tubeSide.allowed, 1)} kPa
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">Status</td>
                  <td className="py-1 text-right">
                    <StatusBadge
                      ok={hydraulic.tubeSide.pressureDrop <= hydraulic.tubeSide.allowed}
                      labelOk="APROVADO"
                      labelFail="EXCEDIDO"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Shell side */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {sectionHeader("Hidr\u00e1ulico \u2013 Lado Casco")}
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">Velocidade</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(hydraulic.shellSide.velocity, 2)} m/s
                  </td>
                </tr>
                <tr className="bg-[#F8F8F8]">
                  <td className="py-1 text-[#333333]">Reynolds</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(hydraulic.shellSide.reynolds, 0)}
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">&Delta;P calculado</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(hydraulic.shellSide.pressureDrop, 1)} kPa
                  </td>
                </tr>
                <tr className="bg-[#F8F8F8]">
                  <td className="py-1 text-[#333333]">&Delta;P admiss&iacute;vel</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(hydraulic.shellSide.allowed, 1)} kPa
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">Status</td>
                  <td className="py-1 text-right">
                    <StatusBadge
                      ok={hydraulic.shellSide.pressureDrop <= hydraulic.shellSide.allowed}
                      labelOk="APROVADO"
                      labelFail="EXCEDIDO"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================================================================
          7. Mechanical Results
          ================================================================ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Shell */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {sectionHeader("Casco")}
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">Espessura adotada</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(mechanical.shell.thickness, 1)} mm
                  </td>
                </tr>
                <tr className="bg-[#F8F8F8]">
                  <td className="py-1 text-[#333333]">Espessura requerida</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(mechanical.shell.requiredThickness, 2)} mm
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">Press&atilde;o admiss&iacute;vel</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(mechanical.shell.allowablePressure, 0)} kPa
                  </td>
                </tr>
                <tr className="bg-[#F8F8F8]">
                  <td className="py-1 text-[#333333]">Status</td>
                  <td className="py-1 text-right">
                    <StatusBadge
                      ok={mechanical.shell.isAdequate}
                      labelOk="APROVADO"
                      labelFail="REPROVADO"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tubesheet */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {sectionHeader("Espelho")}
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">Espessura adotada</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(mechanical.tubesheet.thickness, 1)} mm
                  </td>
                </tr>
                <tr className="bg-[#F8F8F8]">
                  <td className="py-1 text-[#333333]">Espessura requerida</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(mechanical.tubesheet.requiredThickness, 2)} mm
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">Tens&atilde;o (flex&atilde;o)</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(mechanical.tubesheet.stress, 1)} MPa
                  </td>
                </tr>
                <tr className="bg-[#F8F8F8]">
                  <td className="py-1 text-[#333333]">Status</td>
                  <td className="py-1 text-right">
                    <StatusBadge
                      ok={mechanical.tubesheet.isAdequate}
                      labelOk="APROVADO"
                      labelFail="REPROVADO"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Baffles */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {sectionHeader("Chicanas")}
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">Espessura adotada</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(mechanical.baffle.thickness, 1)} mm
                  </td>
                </tr>
                <tr className="bg-[#F8F8F8]">
                  <td className="py-1 text-[#333333]">Espessura m&iacute;nima</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(mechanical.baffle.minThickness, 2)} mm
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">Frequ&ecirc;ncia natural</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(mechanical.baffle.vibrationFrequency, 1)} Hz
                  </td>
                </tr>
                <tr className="bg-[#F8F8F8]">
                  <td className="py-1 text-[#333333]">Velocidade cr&iacute;tica</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(mechanical.baffle.criticalVelocity, 2)} m/s
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-1 text-[#333333]">Vibra&ccedil;&atilde;o</td>
                  <td className="py-1 text-right">
                    <StatusBadge
                      ok={mechanical.baffle.isVibrationOK}
                      labelOk="SEM RISCO"
                      labelFail="RISCO"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================================================================
          8. Export PDF Button
          ================================================================ */}
      <div className="sticky bottom-0 rounded-lg bg-white/90 p-4 text-center shadow-md backdrop-blur">
        <button
          type="button"
          onClick={onExportPDF}
          className="inline-flex items-center gap-2 rounded-lg bg-dantherm-red px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#A30F28] focus:outline-none focus:ring-2 focus:ring-dantherm-red focus:ring-offset-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3"
            />
          </svg>
          Exportar Memorial de C&aacute;lculo (PDF)
        </button>
      </div>
    </div>
  );
};

export default ResultsPanel;
