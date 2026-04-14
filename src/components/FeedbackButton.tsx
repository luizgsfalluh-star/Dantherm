import React, { useState, useCallback } from 'react';
import type { HeatExchangerInput, CalculationResults } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeedbackType = 'bug' | 'suggestion' | 'calculation-error';
type Severity = 'low' | 'medium' | 'high';

interface FeedbackButtonProps {
  input: HeatExchangerInput;
  results: CalculationResults | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APP_VERSION = '0.0.0';
const REPO = 'luizgsfalluh-star/Dantherm';

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: 'Bug',
  suggestion: 'Sugestao',
  'calculation-error': 'Erro de calculo',
};

const TYPE_GITHUB_LABELS: Record<FeedbackType, string> = {
  bug: 'bug',
  suggestion: 'enhancement',
  'calculation-error': 'calculation-error',
};

const PLACEHOLDERS: Record<FeedbackType, string> = {
  bug: 'Descreva o que aconteceu, o que era esperado, e os passos para reproduzir...',
  suggestion: 'Descreva a melhoria ou funcionalidade que gostaria de ver...',
  'calculation-error':
    'Descreva o valor obtido, o valor esperado, e a fonte de referencia (norma, artigo, software)...',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMarkdown(
  type: FeedbackType,
  _title: string,
  description: string,
  severity: Severity | null,
  input: HeatExchangerInput,
  results: CalculationResults | null,
): string {
  const timestamp = new Date().toISOString();
  const typeLabel = TYPE_LABELS[type];

  let md = `## Tipo\n${typeLabel}`;
  if (type === 'bug' && severity) {
    md += ` | Severidade: ${SEVERITY_LABELS[severity]}`;
  }
  md += '\n\n';

  md += `## Descricao\n${description}\n\n`;

  md += `## Contexto do Sistema\n`;
  md += `- Versao: ${APP_VERSION}\n`;
  md += `- Data: ${timestamp}\n\n`;

  md += `## Dados de Entrada\n`;
  md += '```json\n';
  md += JSON.stringify(input, null, 2);
  md += '\n```\n\n';

  md += `## Resultados Obtidos\n`;
  if (results) {
    const summary = {
      thermal: {
        totalQ: results.thermal.totalQ,
        globalLMTD: results.thermal.globalLMTD,
        Ft: results.thermal.Ft,
        correctedLMTD: results.thermal.correctedLMTD,
        averageU: results.thermal.averageU,
        averageUClean: results.thermal.averageUClean,
        totalArea: results.thermal.totalArea,
        availableArea: results.thermal.availableArea,
        overdesignPercent: results.thermal.overdesignPercent,
        isAdequate: results.thermal.isAdequate,
      },
      hydraulic: results.hydraulic,
      mechanical: results.mechanical,
    };
    md += '```json\n';
    md += JSON.stringify(summary, null, 2);
    md += '\n```\n';
  } else {
    md += '_Nenhum calculo executado._\n';
  }

  return md;
}

async function submitViaGitHubAPI(
  title: string,
  body: string,
  label: string,
): Promise<boolean> {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        title,
        body,
        labels: [label],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ input, results }) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setType('bug');
    setTitle('');
    setDescription('');
    setSeverity('medium');
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      setSubmitting(true);

      const md = buildMarkdown(
        type,
        title,
        description,
        type === 'bug' ? severity : null,
        input,
        results,
      );
      const label = TYPE_GITHUB_LABELS[type];

      const token = import.meta.env.VITE_GITHUB_TOKEN;
      if (token) {
        const ok = await submitViaGitHubAPI(title, md, label);
        if (ok) {
          showToast('Issue criada com sucesso!');
        } else {
          showToast('Erro ao criar issue. Tente o modo manual.');
        }
      } else {
        try {
          await navigator.clipboard.writeText(md);
        } catch {
          // clipboard may fail in some contexts — proceed anyway
        }
        const params = new URLSearchParams({ title, labels: label });
        window.open(
          `https://github.com/${REPO}/issues/new?${params.toString()}`,
          '_blank',
        );
        showToast('Texto copiado! Cole na issue.');
      }

      setSubmitting(false);
      setOpen(false);
      resetForm();
    },
    [type, title, description, severity, input, results, resetForm, showToast],
  );

  return (
    <>
      {/* ---- Floating Button ---- */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#C41230] text-white shadow-lg transition-transform hover:scale-110 hover:bg-[#A30F28] focus:outline-none focus:ring-2 focus:ring-[#C41230] focus:ring-offset-2"
        title="Reportar bug ou sugestao"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.96l-6.93-12a2 2 0 00-3.5 0l-6.93 12A2 2 0 005.07 19z"
          />
        </svg>
      </button>

      {/* ---- Toast ---- */}
      {toast && (
        <div className="fixed bottom-20 right-6 z-50 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* ---- Modal Backdrop + Dialog ---- */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">
                Reportar Feedback
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-5 py-4">
              {/* Type */}
              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-gray-600">
                  Tipo
                </legend>
                <div className="flex gap-4">
                  {(
                    ['bug', 'suggestion', 'calculation-error'] as const
                  ).map((t) => (
                    <label key={t} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="radio"
                        name="feedback-type"
                        value={t}
                        checked={type === t}
                        onChange={() => setType(t)}
                        className="accent-[#C41230]"
                      />
                      {TYPE_LABELS[t]}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Title */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Titulo <span className="text-[#C41230]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Resumo breve do problema ou sugestao"
                  className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41230]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Descricao
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={PLACEHOLDERS[type]}
                  rows={4}
                  className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41230]"
                />
              </div>

              {/* Severity (bugs only) */}
              {type === 'bug' && (
                <fieldset>
                  <legend className="mb-1.5 text-xs font-medium text-gray-600">
                    Severidade
                  </legend>
                  <div className="flex gap-4">
                    {(['low', 'medium', 'high'] as const).map((s) => (
                      <label
                        key={s}
                        className="flex items-center gap-1.5 text-sm"
                      >
                        <input
                          type="radio"
                          name="severity"
                          value={s}
                          checked={severity === s}
                          onChange={() => setSeverity(s)}
                          className="accent-[#C41230]"
                        />
                        {SEVERITY_LABELS[s]}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="rounded bg-[#C41230] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#A30F28] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;
