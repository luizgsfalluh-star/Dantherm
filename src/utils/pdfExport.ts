// =============================================================================
// Dantherm - PDF Export Utility
// Generates a professional Memorial de Calculo (Calculation Report) for
// shell-and-tube heat exchangers per TEMA/ASME standards.
// =============================================================================

import jsPDF from 'jspdf';
import type { HeatExchangerInput, CalculationResults } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 15;
const MARGIN_R = 15;
const MARGIN_T = 25;
const MARGIN_B = 25;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const RED = { r: 196, g: 18, b: 48 }; // #C41230
const DARK_RED = { r: 139, g: 0, b: 0 }; // #8B0000
const LIGHT_GRAY = { r: 245, g: 245, b: 245 }; // #F5F5F5

// ---------------------------------------------------------------------------
// Helper: addHeader
// ---------------------------------------------------------------------------

function addHeader(doc: jsPDF, _pageNum: number, _totalPages: number): void {
  doc.setDrawColor(RED.r, RED.g, RED.b);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_L, 12, PAGE_W - MARGIN_R, 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(RED.r, RED.g, RED.b);
  doc.text('DANTHERM', MARGIN_L, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('Memorial de Calculo Termico e Mecanico', PAGE_W - MARGIN_R, 10, {
    align: 'right',
  });

  // Reset text color
  doc.setTextColor(0, 0, 0);
}

// ---------------------------------------------------------------------------
// Helper: addFooter
// ---------------------------------------------------------------------------

function addFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  const footerY = PAGE_H - 12;

  doc.setDrawColor(RED.r, RED.g, RED.b);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_L, footerY - 3, PAGE_W - MARGIN_R, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(80, 80, 80);
  doc.text('Dantherm Industria e Comercio Ltda', MARGIN_L, footerY);
  doc.text(
    'Av. Atalaia do Norte, 22 - Cumbica/Guarulhos - CEP 07240-120/SP',
    PAGE_W / 2,
    footerY,
    { align: 'center' }
  );
  doc.text(
    `Pagina ${pageNum}/${totalPages}`,
    PAGE_W - MARGIN_R,
    footerY,
    { align: 'right' }
  );

  doc.setTextColor(0, 0, 0);
}

// ---------------------------------------------------------------------------
// Helper: addTable
// ---------------------------------------------------------------------------

function addTable(
  doc: jsPDF,
  y: number,
  headers: string[],
  rows: string[][],
  colWidths: number[]
): number {
  const rowHeight = 6;
  const headerHeight = 7;
  let currentY = y;

  // Header row
  let x = MARGIN_L;
  doc.setFillColor(DARK_RED.r, DARK_RED.g, DARK_RED.b);
  doc.rect(MARGIN_L, currentY, CONTENT_W, headerHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + 2, currentY + 5);
    x += colWidths[i];
  }
  currentY += headerHeight;

  // Data rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  for (let r = 0; r < rows.length; r++) {
    // Alternating background
    if (r % 2 === 1) {
      doc.setFillColor(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b);
      doc.rect(MARGIN_L, currentY, CONTENT_W, rowHeight, 'F');
    }

    doc.setTextColor(30, 30, 30);
    x = MARGIN_L;
    for (let c = 0; c < rows[r].length; c++) {
      doc.text(rows[r][c], x + 2, currentY + 4.5);
      x += colWidths[c];
    }
    currentY += rowHeight;
  }

  // Table border
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN_L, y, CONTENT_W, currentY - y);

  doc.setTextColor(0, 0, 0);
  return currentY + 4;
}

// ---------------------------------------------------------------------------
// Helper: section title
// ---------------------------------------------------------------------------

function sectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(DARK_RED.r, DARK_RED.g, DARK_RED.b);
  doc.text(title, MARGIN_L, y);
  doc.setDrawColor(DARK_RED.r, DARK_RED.g, DARK_RED.b);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, y + 1.5, MARGIN_L + doc.getTextWidth(title), y + 1.5);
  doc.setTextColor(0, 0, 0);
  return y + 8;
}

// ---------------------------------------------------------------------------
// Helper: formula line
// ---------------------------------------------------------------------------

function formulaLine(doc: jsPDF, y: number, text: string): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(text, MARGIN_L + 4, y);
  return y + 5;
}

// ---------------------------------------------------------------------------
// Helper: check page overflow
// ---------------------------------------------------------------------------

function checkOverflow(
  doc: jsPDF,
  y: number,
  needed: number,
  pageNum: { value: number },
  totalPages: number
): number {
  if (y + needed > PAGE_H - MARGIN_B) {
    addFooter(doc, pageNum.value, totalPages);
    doc.addPage();
    pageNum.value += 1;
    addHeader(doc, pageNum.value, totalPages);
    return MARGIN_T + 5;
  }
  return y;
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

export function generatePDF(
  input: HeatExchangerInput,
  results: CalculationResults
): void {
  const totalPages = 5;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageNum = { value: 1 };

  const th = results.thermal;
  const hy = results.hydraulic;
  const me = results.mechanical;

  // =========================================================================
  // PAGE 1: Cover + Summary
  // =========================================================================

  addHeader(doc, 1, totalPages);

  let y = 45;

  // Title block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text('MEMORIAL DE CALCULO TERMICO E MECANICO', PAGE_W / 2, y, {
    align: 'center',
  });
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('Trocador de Calor Casco e Tubos', PAGE_W / 2, y, {
    align: 'center',
  });
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(RED.r, RED.g, RED.b);
  doc.text(`TEMA ${input.shell.temaClass}`, PAGE_W / 2, y, {
    align: 'center',
  });
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Referencia: ${input.referenceNumber}`, PAGE_W / 2, y, {
    align: 'center',
  });
  y += 6;
  doc.text(`Data: ${input.projectDate}`, PAGE_W / 2, y, { align: 'center' });
  y += 10;

  // Horizontal separator
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
  y += 8;

  // Summary table
  y = sectionTitle(doc, y, 'RESUMO DO PROJETO');

  const statusText = th.isAdequate ? 'ADEQUADO' : 'INADEQUADO';
  const summaryHeaders = ['Parametro', 'Valor', 'Unidade'];
  const summaryRows: string[][] = [
    ['Carga Termica (Q)', th.totalQ.toFixed(2), 'kW'],
    ['LMTD', th.globalLMTD.toFixed(2), 'degC'],
    ['Ft', th.Ft.toFixed(4), '-'],
    ['LMTD Corrigido', th.correctedLMTD.toFixed(2), 'degC'],
    ['Area Requerida', th.totalArea.toFixed(3), 'm2'],
    ['Area Disponivel', th.availableArea.toFixed(3), 'm2'],
    ['Sobre-area', th.overdesignPercent.toFixed(1), '%'],
    ['U medio (servico)', th.averageU.toFixed(2), 'W/m2K'],
    ['U medio (limpo)', th.averageUClean.toFixed(2), 'W/m2K'],
    ['Status', statusText, ''],
  ];
  const summaryWidths = [70, 60, 50];
  y = addTable(doc, y, summaryHeaders, summaryRows, summaryWidths);

  addFooter(doc, 1, totalPages);

  // =========================================================================
  // PAGE 2: Process Data
  // =========================================================================

  doc.addPage();
  pageNum.value = 2;
  addHeader(doc, 2, totalPages);

  y = MARGIN_T + 5;
  y = sectionTitle(doc, y, 'DADOS DE PROCESSO');

  const sf = input.shellSideFluid;
  const tf = input.tubeSideFluid;
  const tubeTempOut =
    th.zones.length > 0
      ? th.zones[th.zones.length - 1].tempColdOut
      : tf.tempIn;

  const processHeaders = ['Parametro', 'Unidade', 'Lado Casco', 'Lado Tubos'];
  const processRows: string[][] = [
    ['Fluido', '-', sf.type, tf.fluidType],
    [
      'Vazao',
      'kg/h',
      sf.totalFlowRate.toFixed(1),
      tf.flowRate.toFixed(1),
    ],
    ['T entrada', 'degC', sf.tempIn.toFixed(1), tf.tempIn.toFixed(1)],
    ['T saida', 'degC', sf.tempOut.toFixed(1), tubeTempOut.toFixed(1)],
    ['Pressao', 'kPa', sf.pressure.toFixed(1), tf.pressure.toFixed(1)],
    [
      'Fouling',
      'm2K/W',
      sf.foulingResistance.toFixed(6),
      tf.foulingResistance.toFixed(6),
    ],
  ];
  const processWidths = [45, 30, 52, 53];
  y = addTable(doc, y, processHeaders, processRows, processWidths);

  y += 4;
  y = sectionTitle(doc, y, 'GEOMETRIA');

  const sh = input.shell;
  const tb = input.tube;
  const bf = input.baffle;

  const geoHeaders = ['Parametro', 'Valor', 'Unidade'];
  const geoRows: string[][] = [
    ['Diametro interno do casco', sh.innerDiameter.toFixed(1), 'mm'],
    ['Comprimento dos tubos', sh.tubeLength.toFixed(1), 'mm'],
    ['Passes no casco', sh.shellPasses.toString(), '-'],
    ['Diametro externo dos tubos', tb.od.toFixed(2), 'mm'],
    ['Espessura da parede do tubo', tb.wallThickness.toFixed(2), 'mm'],
    ['Numero de tubos', tb.count.toString(), '-'],
    ['Passes nos tubos', tb.passes.toString(), '-'],
    ['Pitch dos tubos', tb.pitch.toFixed(2), 'mm'],
    ['Arranjo dos tubos', tb.arrangement, '-'],
    ['Material dos tubos', tb.material, '-'],
    ['Tipo de chicana', bf.type, '-'],
    ['Espacamento de chicanas', bf.spacing.toFixed(1), 'mm'],
    ['Corte de chicana', bf.cutPercent.toFixed(0), '%'],
    ['Numero de chicanas', bf.count.toString(), '-'],
  ];
  const geoWidths = [80, 55, 45];
  y = addTable(doc, y, geoHeaders, geoRows, geoWidths);

  addFooter(doc, 2, totalPages);

  // =========================================================================
  // PAGE 3: Thermal Calculation Detail
  // =========================================================================

  doc.addPage();
  pageNum.value = 3;
  addHeader(doc, 3, totalPages);

  y = MARGIN_T + 5;
  y = sectionTitle(doc, y, 'CALCULO TERMICO DETALHADO');

  // Formulas
  y = formulaLine(
    doc,
    y,
    `Q = m_dot x Dh = ${sf.totalFlowRate.toFixed(1)} x ${((sf.enthalpyIn - sf.enthalpyOut)).toFixed(3)} = ${th.totalQ.toFixed(2)} kW`
  );
  y = formulaLine(
    doc,
    y,
    `T_c,out = T_c,in + Q / (m_c x Cp_c) = ${tf.tempIn.toFixed(1)} + ${th.totalQ.toFixed(2)} / (${tf.flowRate.toFixed(1)} x ${tf.cp.toFixed(3)}) = ${tubeTempOut.toFixed(2)} degC`
  );

  const dt1 = sf.tempIn - tubeTempOut;
  const dt2 = sf.tempOut - tf.tempIn;
  y = formulaLine(
    doc,
    y,
    `DT1 = T_h,in - T_c,out = ${sf.tempIn.toFixed(1)} - ${tubeTempOut.toFixed(1)} = ${dt1.toFixed(2)} degC`
  );
  y = formulaLine(
    doc,
    y,
    `DT2 = T_h,out - T_c,in = ${sf.tempOut.toFixed(1)} - ${tf.tempIn.toFixed(1)} = ${dt2.toFixed(2)} degC`
  );
  y = formulaLine(
    doc,
    y,
    `LMTD = (DT1 - DT2) / ln(DT1/DT2) = (${dt1.toFixed(2)} - ${dt2.toFixed(2)}) / ln(${dt1.toFixed(2)}/${dt2.toFixed(2)}) = ${th.globalLMTD.toFixed(2)} degC`
  );
  y = formulaLine(doc, y, `Ft = f(R, P) = ${th.Ft.toFixed(4)}`);
  y = formulaLine(
    doc,
    y,
    `LMTD corrigido = LMTD x Ft = ${th.globalLMTD.toFixed(2)} x ${th.Ft.toFixed(4)} = ${th.correctedLMTD.toFixed(2)} degC`
  );

  y += 4;

  // Zone summary table
  y = checkOverflow(doc, y, 10 + th.zones.length * 6, pageNum, totalPages);
  y = sectionTitle(doc, y, 'RESUMO POR ZONA');

  const zoneHeaders = ['Zona', 'T_h (degC)', 'T_c (degC)', 'Q (kW)', 'U (W/m2K)', 'A (m2)'];
  const zoneRows = th.zones.map((z) => [
    (z.zoneIndex + 1).toString(),
    `${z.tempHotIn.toFixed(1)} -> ${z.tempHotOut.toFixed(1)}`,
    `${z.tempColdIn.toFixed(1)} -> ${z.tempColdOut.toFixed(1)}`,
    z.Q.toFixed(2),
    z.U.toFixed(2),
    z.areaRequired.toFixed(4),
  ]);
  const zoneWidths = [18, 38, 38, 30, 30, 26];
  y = addTable(doc, y, zoneHeaders, zoneRows, zoneWidths);

  // Totals line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(
    `Total: Q = ${th.totalQ.toFixed(2)} kW | A requerida = ${th.totalArea.toFixed(3)} m2 | A disponivel = ${th.availableArea.toFixed(3)} m2 | Sobre-area = ${th.overdesignPercent.toFixed(1)}%`,
    MARGIN_L,
    y
  );
  y += 6;

  addFooter(doc, 3, totalPages);

  // =========================================================================
  // PAGE 4: Hydraulic Calculation
  // =========================================================================

  doc.addPage();
  pageNum.value = 4;
  addHeader(doc, 4, totalPages);

  y = MARGIN_T + 5;
  y = sectionTitle(doc, y, 'CALCULO HIDRAULICO');

  // Tube side
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Lado dos Tubos', MARGIN_L, y);
  doc.setTextColor(0, 0, 0);
  y += 6;

  const tubeID = tb.od - 2 * tb.wallThickness;
  const tubeFlowArea =
    (Math.PI / 4) * Math.pow(tubeID / 1000, 2) * (tb.count / tb.passes);

  y = formulaLine(
    doc,
    y,
    `d_i = OD - 2t = ${tb.od.toFixed(2)} - 2 x ${tb.wallThickness.toFixed(2)} = ${tubeID.toFixed(2)} mm`
  );
  y = formulaLine(
    doc,
    y,
    `A_flow = (pi/4) x d_i^2 x (N_t / N_p) = ${(tubeFlowArea * 1e6).toFixed(2)} mm2 = ${tubeFlowArea.toFixed(6)} m2`
  );
  y = formulaLine(
    doc,
    y,
    `v = m_dot / (rho x A_flow) = ${hy.tubeSide.velocity.toFixed(3)} m/s`
  );
  y = formulaLine(
    doc,
    y,
    `Re = rho x v x d_i / mu = ${hy.tubeSide.reynolds.toFixed(0)}`
  );
  y = formulaLine(
    doc,
    y,
    `DP_tubos = ${hy.tubeSide.pressureDrop.toFixed(2)} kPa (permitido: ${hy.tubeSide.allowed.toFixed(2)} kPa)`
  );

  y += 6;

  // Shell side
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Lado do Casco', MARGIN_L, y);
  doc.setTextColor(0, 0, 0);
  y += 6;

  const pt = tb.pitch;
  const De =
    tb.arrangement === 'Triangular' || tb.arrangement === 'RotatedTriangular'
      ? (4 * ((Math.sqrt(3) / 4) * pt * pt - (Math.PI / 8) * tb.od * tb.od)) /
        ((Math.PI / 2) * tb.od)
      : (4 * (pt * pt - (Math.PI / 4) * tb.od * tb.od)) /
        (Math.PI * tb.od);

  y = formulaLine(doc, y, `D_e (diametro equivalente) = ${De.toFixed(3)} mm`);
  y = formulaLine(
    doc,
    y,
    `A_s = D_s x C x B / P_t  (area de escoamento no casco)`
  );
  y = formulaLine(
    doc,
    y,
    `v_s = m_dot / (rho x A_s) = ${hy.shellSide.velocity.toFixed(3)} m/s`
  );
  y = formulaLine(
    doc,
    y,
    `Re_s = rho x v_s x D_e / mu = ${hy.shellSide.reynolds.toFixed(0)}`
  );
  y = formulaLine(
    doc,
    y,
    `DP_casco = ${hy.shellSide.pressureDrop.toFixed(2)} kPa (permitido: ${hy.shellSide.allowed.toFixed(2)} kPa)`
  );

  y += 6;

  // Hydraulic summary table
  y = sectionTitle(doc, y, 'RESUMO HIDRAULICO');

  const hydHeaders = ['Parametro', 'Lado Tubos', 'Lado Casco', 'Unidade'];
  const hydRows: string[][] = [
    [
      'Velocidade',
      hy.tubeSide.velocity.toFixed(3),
      hy.shellSide.velocity.toFixed(3),
      'm/s',
    ],
    [
      'Reynolds',
      hy.tubeSide.reynolds.toFixed(0),
      hy.shellSide.reynolds.toFixed(0),
      '-',
    ],
    [
      'Perda de carga',
      hy.tubeSide.pressureDrop.toFixed(2),
      hy.shellSide.pressureDrop.toFixed(2),
      'kPa',
    ],
    [
      'Limite permitido',
      hy.tubeSide.allowed.toFixed(2),
      hy.shellSide.allowed.toFixed(2),
      'kPa',
    ],
  ];
  const hydWidths = [50, 40, 40, 50];
  y = addTable(doc, y, hydHeaders, hydRows, hydWidths);

  addFooter(doc, 4, totalPages);

  // =========================================================================
  // PAGE 5: Mechanical Calculation
  // =========================================================================

  doc.addPage();
  pageNum.value = 5;
  addHeader(doc, 5, totalPages);

  y = MARGIN_T + 5;
  y = sectionTitle(doc, y, 'CALCULO MECANICO');

  // Shell
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Casco - ASME Secao VIII, Div. 1 (UG-28)', MARGIN_L, y);
  doc.setTextColor(0, 0, 0);
  y += 6;

  y = formulaLine(
    doc,
    y,
    `Espessura nominal do casco: ${me.shell.thickness.toFixed(2)} mm`
  );
  y = formulaLine(
    doc,
    y,
    `Espessura minima requerida (ASME): ${me.shell.requiredThickness.toFixed(2)} mm`
  );
  y = formulaLine(
    doc,
    y,
    `Pressao maxima admissivel: ${me.shell.allowablePressure.toFixed(2)} kPa`
  );
  y = formulaLine(
    doc,
    y,
    `Status: ${me.shell.isAdequate ? 'ADEQUADO' : 'INADEQUADO'}`
  );

  y += 6;

  // Tubesheet
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Espelho (Tubesheet) - TEMA RCB-7', MARGIN_L, y);
  doc.setTextColor(0, 0, 0);
  y += 6;

  y = formulaLine(
    doc,
    y,
    `Espessura nominal: ${me.tubesheet.thickness.toFixed(2)} mm`
  );
  y = formulaLine(
    doc,
    y,
    `Espessura minima requerida (TEMA): ${me.tubesheet.requiredThickness.toFixed(2)} mm`
  );
  y = formulaLine(
    doc,
    y,
    `Tensao de flexao calculada: ${me.tubesheet.stress.toFixed(2)} MPa`
  );
  y = formulaLine(
    doc,
    y,
    `Status: ${me.tubesheet.isAdequate ? 'ADEQUADO' : 'INADEQUADO'}`
  );

  y += 6;

  // Baffles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Chicanas - TEMA RCB-4 / Vibracao', MARGIN_L, y);
  doc.setTextColor(0, 0, 0);
  y += 6;

  y = formulaLine(
    doc,
    y,
    `Espessura nominal: ${me.baffle.thickness.toFixed(2)} mm`
  );
  y = formulaLine(
    doc,
    y,
    `Espessura minima (TEMA): ${me.baffle.minThickness.toFixed(2)} mm`
  );
  y = formulaLine(
    doc,
    y,
    `Frequencia natural dos tubos: ${me.baffle.vibrationFrequency.toFixed(2)} Hz`
  );
  y = formulaLine(
    doc,
    y,
    `Velocidade critica de escoamento cruzado: ${me.baffle.criticalVelocity.toFixed(3)} m/s`
  );
  y = formulaLine(
    doc,
    y,
    `Verificacao de vibracao: ${me.baffle.isVibrationOK ? 'OK - Sem risco' : 'ATENCAO - Risco de vibracao'}`
  );

  y += 8;

  // Mechanical summary table
  y = sectionTitle(doc, y, 'RESUMO MECANICO');

  const mechHeaders = ['Componente', 'Espessura (mm)', 'Requerido (mm)', 'Status'];
  const mechRows: string[][] = [
    [
      'Casco',
      me.shell.thickness.toFixed(2),
      me.shell.requiredThickness.toFixed(2),
      me.shell.isAdequate ? 'ADEQUADO' : 'INADEQUADO',
    ],
    [
      'Espelho',
      me.tubesheet.thickness.toFixed(2),
      me.tubesheet.requiredThickness.toFixed(2),
      me.tubesheet.isAdequate ? 'ADEQUADO' : 'INADEQUADO',
    ],
    [
      'Chicanas',
      me.baffle.thickness.toFixed(2),
      me.baffle.minThickness.toFixed(2),
      me.baffle.isVibrationOK ? 'OK' : 'ATENCAO',
    ],
  ];
  const mechWidths = [45, 40, 45, 50];
  y = addTable(doc, y, mechHeaders, mechRows, mechWidths);

  addFooter(doc, 5, totalPages);

  // =========================================================================
  // Save
  // =========================================================================

  doc.save(
    `Memorial_${input.shell.temaClass}_${input.projectDate || 'calc'}.pdf`
  );
}
