import React, { useCallback, useEffect, useState } from 'react';
import type {
  HeatExchangerInput,
  FluidComponent,
  TEMAClassification,
  BaffleType,
  BaffleMaterial,
  TubeMaterial,
  TubeArrangement,
  ShellFluidType,
  TubeSideFluidType,
} from '../types';
import { componentPresets } from '../data/componentPresets';
import { getWaterProperties } from '../data/waterProperties';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InputFormProps {
  input: HeatExchangerInput;
  setInput: React.Dispatch<React.SetStateAction<HeatExchangerInput>>;
  onCalculate: () => void;
  onLoadPreset: () => void;
}

// ---------------------------------------------------------------------------
// Helpers — section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group mb-4">
      <summary className="cursor-pointer select-none bg-[#8B0000] text-white font-semibold text-sm px-4 py-2 rounded-t list-none flex items-center justify-between">
        <span>{title}</span>
        <svg
          className="w-4 h-4 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="bg-white border border-t-0 border-gray-200 rounded-b shadow-sm p-4">
        {children}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Reusable field components
// ---------------------------------------------------------------------------

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <label className="block text-xs text-gray-600 mb-0.5">
      {label}
      {hint && <span className="ml-1 text-[10px] text-gray-400">({hint})</span>}
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  hint,
  min,
  max,
  step,
  readOnly,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <FieldLabel label={label} hint={hint} />
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        readOnly={readOnly}
        className={`w-full border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-dantherm-red ${
          readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <FieldLabel label={label} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-dantherm-red"
      />
    </div>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <FieldLabel label={label} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full border rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-dantherm-red"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const InputForm: React.FC<InputFormProps> = ({ input, setInput, onCalculate, onLoadPreset }) => {
  const [presetSelect, setPresetSelect] = useState('');

  // ---- nested updaters ----

  const updateField = useCallback(
    <K extends keyof HeatExchangerInput>(field: K, value: HeatExchangerInput[K]) => {
      setInput((prev) => ({ ...prev, [field]: value }));
    },
    [setInput],
  );

  const updateShell = useCallback(
    (field: string, value: unknown) => {
      setInput((prev) => ({ ...prev, shell: { ...prev.shell, [field]: value } }));
    },
    [setInput],
  );

  const updateBaffle = useCallback(
    (field: string, value: unknown) => {
      setInput((prev) => ({ ...prev, baffle: { ...prev.baffle, [field]: value } }));
    },
    [setInput],
  );

  const updateTube = useCallback(
    (field: string, value: unknown) => {
      setInput((prev) => ({ ...prev, tube: { ...prev.tube, [field]: value } }));
    },
    [setInput],
  );

  const updateShellFluid = useCallback(
    (field: string, value: unknown) => {
      setInput((prev) => ({
        ...prev,
        shellSideFluid: { ...prev.shellSideFluid, [field]: value },
      }));
    },
    [setInput],
  );

  const updateTubeFluid = useCallback(
    (field: string, value: unknown) => {
      setInput((prev) => ({
        ...prev,
        tubeSideFluid: { ...prev.tubeSideFluid, [field]: value },
      }));
    },
    [setInput],
  );

  // ---- component helpers ----

  const addComponent = useCallback(() => {
    const newComp: FluidComponent = {
      id: crypto.randomUUID(),
      name: '',
      formula: '',
      flowRate: 0,
      molecularWeight: 0,
      cpVapor: 0,
      cpLiquid: 0,
      kVapor: 0,
      kLiquid: 0,
      viscosityVapor: 0,
      viscosityLiquid: 0,
      latentHeat: 0,
      condensationTemp: 0,
      isCondensable: true,
    };
    setInput((prev) => ({
      ...prev,
      shellSideFluid: {
        ...prev.shellSideFluid,
        components: [...prev.shellSideFluid.components, newComp],
      },
    }));
  }, [setInput]);

  const removeComponent = useCallback(
    (id: string) => {
      setInput((prev) => ({
        ...prev,
        shellSideFluid: {
          ...prev.shellSideFluid,
          components: prev.shellSideFluid.components.filter((c) => c.id !== id),
        },
      }));
    },
    [setInput],
  );

  const updateComponent = useCallback(
    (id: string, field: string, value: unknown) => {
      setInput((prev) => ({
        ...prev,
        shellSideFluid: {
          ...prev.shellSideFluid,
          components: prev.shellSideFluid.components.map((c) =>
            c.id === id ? { ...c, [field]: value } : c,
          ),
        },
      }));
    },
    [setInput],
  );

  const addPresetComponent = useCallback(
    (presetId: string) => {
      const preset = componentPresets.find((p) => p.id === presetId);
      if (!preset) return;
      const newComp: FluidComponent = { ...preset, id: crypto.randomUUID() };
      setInput((prev) => ({
        ...prev,
        shellSideFluid: {
          ...prev.shellSideFluid,
          components: [...prev.shellSideFluid.components, newComp],
        },
      }));
    },
    [setInput],
  );

  // ---- auto-fill water properties when tube fluid is Water ----

  useEffect(() => {
    if (input.tubeSideFluid.fluidType !== 'Water') return;
    try {
      const props = getWaterProperties(input.tubeSideFluid.tempIn);
      setInput((prev) => ({
        ...prev,
        tubeSideFluid: {
          ...prev.tubeSideFluid,
          cp: props.specificHeat,
          density: props.density,
          viscosity: props.viscosity * 1000, // Pa.s -> mPa.s
          thermalConductivity: props.thermalConductivity,
        },
      }));
    } catch {
      // out of range — keep current values
    }
  }, [input.tubeSideFluid.fluidType, input.tubeSideFluid.tempIn, setInput]);

  // ---- auto-recalculate baffle count when spacing changes ----

  useEffect(() => {
    if (input.baffle.spacing > 0 && input.shell.tubeLength > 0) {
      const autoCount = Math.floor(input.shell.tubeLength / input.baffle.spacing) - 1;
      if (autoCount >= 0 && autoCount !== input.baffle.count) {
        setInput((prev) => ({
          ...prev,
          baffle: { ...prev.baffle, count: Math.max(0, autoCount) },
        }));
      }
    }
  }, [input.baffle.spacing, input.shell.tubeLength, setInput, input.baffle.count]);

  // ---- computed totals for component table ----

  const totalComponentFlow = input.shellSideFluid.components.reduce(
    (sum, c) => sum + c.flowRate,
    0,
  );

  // ---- option lists ----

  const temaOptions: { value: TEMAClassification; label: string }[] = [
    'BEM', 'AES', 'AEL', 'AET', 'AEP', 'AEW', 'AKT', 'AJW', 'BEU', 'BET', 'BEP', 'BEW', 'NEN',
  ].map((v) => ({ value: v as TEMAClassification, label: v }));

  const baffleTypeOptions: { value: BaffleType; label: string }[] = [
    { value: 'SegmentedSingle', label: 'Segmentada Simples' },
    { value: 'SegmentedDouble', label: 'Segmentada Dupla' },
    { value: 'DiscAndRing', label: 'Disco e Anel' },
    { value: 'None', label: 'Sem chicanas' },
  ];

  const baffleMaterialOptions: { value: BaffleMaterial; label: string }[] = [
    { value: 'CarbonSteel', label: 'Aço Carbono' },
    { value: 'SS304', label: 'SS 304' },
    { value: 'SS316L', label: 'SS 316L' },
  ];

  const tubeMaterialOptions: { value: TubeMaterial; label: string }[] = [
    { value: 'SS316L', label: 'SS 316L' },
    { value: 'SS304', label: 'SS 304' },
    { value: 'Copper', label: 'Cobre' },
    { value: 'Titanium', label: 'Titânio' },
    { value: 'CarbonSteel', label: 'Aço Carbono' },
  ];

  const arrangementOptions: { value: TubeArrangement; label: string }[] = [
    { value: 'Triangular', label: 'Triangular' },
    { value: 'Square', label: 'Quadrado' },
    { value: 'RotatedTriangular', label: 'Triangular Rotacionado' },
    { value: 'RotatedSquare', label: 'Quadrado Rotacionado' },
  ];

  const shellFluidTypeOptions: { value: ShellFluidType; label: string }[] = [
    { value: 'PureVapor', label: 'Vapor Puro' },
    { value: 'MixtureWithNoncondensables', label: 'Mistura Vapor+Incondensáveis' },
    { value: 'Liquid', label: 'Líquido' },
    { value: 'Gas', label: 'Gás' },
  ];

  const tubeFluidTypeOptions: { value: TubeSideFluidType; label: string }[] = [
    { value: 'Water', label: 'Água' },
    { value: 'Other', label: 'Outro' },
  ];

  const tubePassOptions: { value: string; label: string }[] = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '4', label: '4' },
    { value: '6', label: '6' },
  ];

  const isWater = input.tubeSideFluid.fluidType === 'Water';
  const isMixture = input.shellSideFluid.type === 'MixtureWithNoncondensables';

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
      {/* ================================================================= */}
      {/* Section 1: Projeto */}
      {/* ================================================================= */}
      <Section title="Projeto">
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Referência"
            value={input.referenceNumber}
            onChange={(v) => updateField('referenceNumber', v)}
          />
          <TextInput
            label="Data"
            value={input.projectDate}
            onChange={(v) => updateField('projectDate', v)}
            type="date"
          />
        </div>
        <div className="mt-3">
          <NumberInput
            label="Número de zonas"
            value={input.numberOfZones}
            onChange={(v) => updateField('numberOfZones', v)}
            min={5}
            max={50}
          />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* Section 2: Geometria do Casco */}
      {/* ================================================================= */}
      <Section title="Geometria do Casco">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput
            label="Classificação TEMA"
            value={input.shell.temaClass}
            onChange={(v) => updateShell('temaClass', v)}
            options={temaOptions}
          />
          <NumberInput
            label="Diâmetro interno (mm)"
            value={input.shell.innerDiameter}
            onChange={(v) => updateShell('innerDiameter', v)}
            min={0}
          />
          <NumberInput
            label="Comprimento dos tubos (mm)"
            value={input.shell.tubeLength}
            onChange={(v) => updateShell('tubeLength', v)}
            min={0}
          />
          <NumberInput
            label="Passes do casco"
            value={input.shell.shellPasses}
            onChange={(v) => updateShell('shellPasses', v)}
            min={1}
            max={4}
          />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* Section 3: Chicanas */}
      {/* ================================================================= */}
      <Section title="Chicanas">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput
            label="Tipo"
            value={input.baffle.type}
            onChange={(v) => updateBaffle('type', v)}
            options={baffleTypeOptions}
          />
          <NumberInput
            label="Corte (%)"
            value={input.baffle.cutPercent}
            onChange={(v) => updateBaffle('cutPercent', v)}
            min={20}
            max={45}
          />
          <NumberInput
            label="Espaçamento (mm)"
            value={input.baffle.spacing}
            onChange={(v) => updateBaffle('spacing', v)}
            hint={`min=${(0.2 * input.shell.innerDiameter).toFixed(0)}, max=${input.shell.innerDiameter}`}
            min={0}
          />
          <NumberInput
            label="Espessura (mm)"
            value={input.baffle.thickness}
            onChange={(v) => updateBaffle('thickness', v)}
            min={0}
          />
          <NumberInput
            label="Quantidade"
            value={input.baffle.count}
            onChange={(v) => updateBaffle('count', v)}
            hint="auto-calculado"
            min={0}
          />
          <SelectInput
            label="Material"
            value={input.baffle.material}
            onChange={(v) => updateBaffle('material', v)}
            options={baffleMaterialOptions}
          />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* Section 4: Tubos */}
      {/* ================================================================= */}
      <Section title="Tubos">
        <div className="mb-3">
          <FieldLabel label="Diâmetro externo (mm)" />
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={input.tube.od}
              onChange={(e) => updateTube('od', parseFloat(e.target.value) || 0)}
              className="flex-1 border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-dantherm-red"
            />
            <button
              type="button"
              onClick={() => updateTube('od', 19.05)}
              className="text-xs border border-dantherm-red text-dantherm-red rounded px-2 py-1 hover:bg-red-50"
            >
              3/4&quot;
            </button>
            <button
              type="button"
              onClick={() => updateTube('od', 25.4)}
              className="text-xs border border-dantherm-red text-dantherm-red rounded px-2 py-1 hover:bg-red-50"
            >
              1&quot;
            </button>
            <button
              type="button"
              onClick={() => updateTube('od', 31.75)}
              className="text-xs border border-dantherm-red text-dantherm-red rounded px-2 py-1 hover:bg-red-50"
            >
              1&frac14;&quot;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="Espessura parede (mm)"
            value={input.tube.wallThickness}
            onChange={(v) => updateTube('wallThickness', v)}
            min={0}
            step={0.1}
          />
          <NumberInput
            label="Quantidade de tubos"
            value={input.tube.count}
            onChange={(v) => updateTube('count', v)}
            min={1}
          />
          <SelectInput
            label="Passes"
            value={String(input.tube.passes)}
            onChange={(v) => updateTube('passes', parseInt(v, 10))}
            options={tubePassOptions}
          />
          <SelectInput
            label="Material"
            value={input.tube.material}
            onChange={(v) => updateTube('material', v)}
            options={tubeMaterialOptions}
          />
          <NumberInput
            label="Pitch (mm)"
            value={input.tube.pitch}
            onChange={(v) => updateTube('pitch', v)}
            min={0}
            step={0.01}
          />
          <SelectInput
            label="Arranjo"
            value={input.tube.arrangement}
            onChange={(v) => updateTube('arrangement', v)}
            options={arrangementOptions}
          />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* Section 5: Fluido Lado Casco */}
      {/* ================================================================= */}
      <Section title="Fluido Lado Casco">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput
            label="Tipo"
            value={input.shellSideFluid.type}
            onChange={(v) => updateShellFluid('type', v)}
            options={shellFluidTypeOptions}
            className="col-span-2"
          />
          <NumberInput
            label="Vazão total (kg/h)"
            value={input.shellSideFluid.totalFlowRate}
            onChange={(v) => updateShellFluid('totalFlowRate', v)}
            className="col-span-2"
          />
          <NumberInput
            label="Temp. entrada (°C)"
            value={input.shellSideFluid.tempIn}
            onChange={(v) => updateShellFluid('tempIn', v)}
          />
          <NumberInput
            label="Temp. saída (°C)"
            value={input.shellSideFluid.tempOut}
            onChange={(v) => updateShellFluid('tempOut', v)}
          />
          <NumberInput
            label="Pressão (kPa abs)"
            value={input.shellSideFluid.pressure}
            onChange={(v) => updateShellFluid('pressure', v)}
          />
          <div /> {/* spacer */}
          <NumberInput
            label="Dens. vapor entrada (kg/m³)"
            value={input.shellSideFluid.densityVaporIn}
            onChange={(v) => updateShellFluid('densityVaporIn', v)}
          />
          <NumberInput
            label="Dens. vapor saída (kg/m³)"
            value={input.shellSideFluid.densityVaporOut}
            onChange={(v) => updateShellFluid('densityVaporOut', v)}
          />
          <NumberInput
            label="Dens. líquido entrada (kg/m³)"
            value={input.shellSideFluid.densityLiquidIn}
            onChange={(v) => updateShellFluid('densityLiquidIn', v)}
          />
          <NumberInput
            label="Dens. líquido saída (kg/m³)"
            value={input.shellSideFluid.densityLiquidOut}
            onChange={(v) => updateShellFluid('densityLiquidOut', v)}
          />
          <NumberInput
            label="Entalpia entrada (kJ/kg)"
            value={input.shellSideFluid.enthalpyIn}
            onChange={(v) => updateShellFluid('enthalpyIn', v)}
          />
          <NumberInput
            label="Entalpia saída (kJ/kg)"
            value={input.shellSideFluid.enthalpyOut}
            onChange={(v) => updateShellFluid('enthalpyOut', v)}
          />
          <NumberInput
            label="Resistência incrustação (m²K/W)"
            value={input.shellSideFluid.foulingResistance}
            onChange={(v) => updateShellFluid('foulingResistance', v)}
            step={0.0001}
            className="col-span-2"
          />
          <NumberInput
            label="Fração vapor entrada (0-1)"
            value={input.shellSideFluid.vaporFractionIn ?? 1.0}
            onChange={(v) => updateShellFluid('vaporFractionIn', v)}
            min={0}
            max={1}
            step={0.01}
            hint="se omitido, inferido do tipo"
          />
          <NumberInput
            label="Fração vapor saída (0-1)"
            value={input.shellSideFluid.vaporFractionOut ?? 0.0}
            onChange={(v) => updateShellFluid('vaporFractionOut', v)}
            min={0}
            max={1}
            step={0.01}
            hint="se omitido, inferido do tipo"
          />
        </div>

        {/* ---- Sub-section 5a: Composição da Mistura ---- */}
        {isMixture && (
          <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-semibold text-dantherm-dark mb-2">
              Composição da Mistura
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-1 py-0.5 text-left">Nome</th>
                    <th className="border px-1 py-0.5 text-left">Fórmula</th>
                    <th className="border px-1 py-0.5 text-right">Vazão (kg/h)</th>
                    <th className="border px-1 py-0.5 text-right">M (g/mol)</th>
                    <th className="border px-1 py-0.5 text-right">Cp Vap</th>
                    <th className="border px-1 py-0.5 text-right">Cp Liq</th>
                    <th className="border px-1 py-0.5 text-right">k Vap</th>
                    <th className="border px-1 py-0.5 text-right">k Liq</th>
                    <th className="border px-1 py-0.5 text-right">&mu; Vap</th>
                    <th className="border px-1 py-0.5 text-right">&mu; Liq</th>
                    <th className="border px-1 py-0.5 text-right">&lambda; (kJ/kg)</th>
                    <th className="border px-1 py-0.5 text-right">T cond (°C)</th>
                    <th className="border px-1 py-0.5 text-center">Cond?</th>
                    <th className="border px-1 py-0.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {input.shellSideFluid.components.map((comp) => (
                    <tr key={comp.id} className="hover:bg-gray-50">
                      <td className="border px-1 py-0.5">
                        <input
                          type="text"
                          value={comp.name}
                          onChange={(e) => updateComponent(comp.id, 'name', e.target.value)}
                          className="w-full text-[11px] border-0 p-0 focus:outline-none focus:ring-0"
                        />
                      </td>
                      <td className="border px-1 py-0.5">
                        <input
                          type="text"
                          value={comp.formula}
                          onChange={(e) => updateComponent(comp.id, 'formula', e.target.value)}
                          className="w-20 text-[11px] border-0 p-0 focus:outline-none focus:ring-0"
                        />
                      </td>
                      {(
                        [
                          'flowRate',
                          'molecularWeight',
                          'cpVapor',
                          'cpLiquid',
                          'kVapor',
                          'kLiquid',
                          'viscosityVapor',
                          'viscosityLiquid',
                          'latentHeat',
                          'condensationTemp',
                        ] as const
                      ).map((field) => (
                        <td key={field} className="border px-1 py-0.5">
                          <input
                            type="number"
                            value={comp[field]}
                            onChange={(e) =>
                              updateComponent(comp.id, field, parseFloat(e.target.value) || 0)
                            }
                            className="w-16 text-[11px] font-mono text-right border-0 p-0 focus:outline-none focus:ring-0"
                          />
                        </td>
                      ))}
                      <td className="border px-1 py-0.5 text-center">
                        <input
                          type="checkbox"
                          checked={comp.isCondensable}
                          onChange={(e) =>
                            updateComponent(comp.id, 'isCondensable', e.target.checked)
                          }
                          className="accent-dantherm-red"
                        />
                      </td>
                      <td className="border px-1 py-0.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeComponent(comp.id)}
                          className="text-red-600 hover:text-red-800 font-bold text-sm leading-none"
                          title="Remover componente"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {input.shellSideFluid.components.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td className="border px-1 py-0.5" colSpan={2}>
                        Totais
                      </td>
                      <td className="border px-1 py-0.5 text-right font-mono">
                        {totalComponentFlow.toFixed(1)}
                      </td>
                      <td className="border px-1 py-0.5" colSpan={11}>
                        {totalComponentFlow > 0 && (
                          <span className="text-[10px] text-gray-500">
                            Fração mássica total:{' '}
                            {input.shellSideFluid.totalFlowRate > 0
                              ? (
                                  (totalComponentFlow / input.shellSideFluid.totalFlowRate) *
                                  100
                                ).toFixed(1)
                              : '---'}
                            %
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={addComponent}
                className="text-xs bg-white border border-gray-300 rounded px-3 py-1 hover:bg-gray-50"
              >
                Adicionar Componente
              </button>
              <div className="flex items-center gap-1">
                <select
                  value={presetSelect}
                  onChange={(e) => setPresetSelect(e.target.value)}
                  className="text-xs border rounded px-2 py-1 bg-white"
                >
                  <option value="">Selecionar preset...</option>
                  {componentPresets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.formula})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!presetSelect}
                  onClick={() => {
                    addPresetComponent(presetSelect);
                    setPresetSelect('');
                  }}
                  className="text-xs bg-dantherm-red text-white rounded px-3 py-1 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Adicionar do Preset
                </button>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ================================================================= */}
      {/* Section 6: Fluido Lado Tubos */}
      {/* ================================================================= */}
      <Section title="Fluido Lado Tubos">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput
            label="Tipo de fluido"
            value={input.tubeSideFluid.fluidType}
            onChange={(v) => updateTubeFluid('fluidType', v)}
            options={tubeFluidTypeOptions}
          />
          <NumberInput
            label="Vazão (kg/h)"
            value={input.tubeSideFluid.flowRate}
            onChange={(v) => updateTubeFluid('flowRate', v)}
          />
          <NumberInput
            label="Temp. entrada (°C)"
            value={input.tubeSideFluid.tempIn}
            onChange={(v) => updateTubeFluid('tempIn', v)}
          />
          <NumberInput
            label="Pressão (kPa abs)"
            value={input.tubeSideFluid.pressure}
            onChange={(v) => updateTubeFluid('pressure', v)}
          />
        </div>

        {isWater && (
          <p className="text-[10px] text-blue-600 mt-2 italic">
            Propriedades calculadas automaticamente para água
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mt-3">
          <NumberInput
            label="Cp (kJ/(kg.K))"
            value={input.tubeSideFluid.cp}
            onChange={(v) => updateTubeFluid('cp', v)}
            readOnly={isWater}
            step={0.001}
          />
          <NumberInput
            label="Densidade (kg/m³)"
            value={input.tubeSideFluid.density}
            onChange={(v) => updateTubeFluid('density', v)}
            readOnly={isWater}
          />
          <NumberInput
            label="Viscosidade (mPa.s)"
            value={input.tubeSideFluid.viscosity}
            onChange={(v) => updateTubeFluid('viscosity', v)}
            readOnly={isWater}
            step={0.001}
          />
          <NumberInput
            label="Cond. térmica (W/(m.K))"
            value={input.tubeSideFluid.thermalConductivity}
            onChange={(v) => updateTubeFluid('thermalConductivity', v)}
            readOnly={isWater}
            step={0.001}
          />
        </div>

        <div className="mt-3">
          <NumberInput
            label="Resistência incrustação (m²K/W)"
            value={input.tubeSideFluid.foulingResistance}
            onChange={(v) => updateTubeFluid('foulingResistance', v)}
            step={0.0001}
          />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* Bottom Buttons */}
      {/* ================================================================= */}
      <div className="sticky bottom-0 bg-dantherm-light pt-3 pb-2 px-1 space-y-2">
        <button
          type="button"
          onClick={onLoadPreset}
          className="w-full border-2 border-dantherm-red text-dantherm-red font-semibold text-sm rounded py-2 hover:bg-red-50 transition-colors"
        >
          Carregar Exemplo BEM
        </button>
        <button
          type="button"
          onClick={onCalculate}
          className="w-full bg-dantherm-red text-white font-bold text-base rounded py-3 hover:bg-red-800 transition-colors shadow"
        >
          Calcular
        </button>
      </div>
    </div>
  );
};

export default InputForm;
