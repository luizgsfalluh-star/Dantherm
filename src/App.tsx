import { useState, useCallback, lazy, Suspense } from 'react';
import type { HeatExchangerInput, CalculationResults } from './types';
import { defaultInput, presetBEM } from './data/presetExample';
import { calculateThermal } from './calculations/thermal';
import { calculateHydraulic } from './calculations/hydraulic';
import { calculateMechanical } from './calculations/mechanical';
import Header from './components/Header';
import InputForm from './components/InputForm';
import FeedbackButton from './components/FeedbackButton';

const ResultsPanel = lazy(() => import('./components/ResultsPanel'));

function App() {
  const [input, setInput] = useState<HeatExchangerInput>(defaultInput);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const handleCalculate = useCallback(() => {
    const thermal = calculateThermal(input);
    const hydraulic = calculateHydraulic(input);
    const mechanical = calculateMechanical(input);
    setResults({ thermal, hydraulic, mechanical });
  }, [input]);

  const handleLoadPreset = useCallback(() => {
    setInput({ ...presetBEM });
    setResults(null);
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (results) {
      const { generatePDF } = await import('./utils/pdfExport');
      generatePDF(input, results);
    }
  }, [input, results]);

  return (
    <div className="min-h-screen bg-dantherm-light">
      <Header />
      <div className="flex flex-col lg:flex-row max-w-[1600px] mx-auto px-4 py-6 gap-6">
        <div className="lg:w-[480px] shrink-0">
          <InputForm
            input={input}
            setInput={setInput}
            onCalculate={handleCalculate}
            onLoadPreset={handleLoadPreset}
          />
        </div>
        <div className="flex-1 min-w-0">
          <Suspense fallback={
            <div className="flex min-h-[320px] items-center justify-center rounded-lg bg-white p-10 shadow-sm">
              <p className="text-sm text-gray-400">Carregando...</p>
            </div>
          }>
            <ResultsPanel
              results={results}
              input={input}
              onExportPDF={handleExportPDF}
            />
          </Suspense>
        </div>
      </div>
      <FeedbackButton input={input} results={results} />
    </div>
  );
}

export default App;
