import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { FileDown, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ITYPES } from '@/lib/domain';
import type { ScenarioDetailOutletContext } from '@/types/scenarioDetail';

import { ScenarioPdfDocument } from './ScenarioPdfDocument';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilePart(s: string): string {
  const t = s.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  return t.slice(0, 48) || 'scenario';
}

export function ExportView() {
  const ctx = useOutletContext<ScenarioDetailOutletContext>();
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { scenario, overallReadiness, riskThread } = ctx;
  const inspType = scenario.inspType ?? 'baseline';
  const inspectionTypeLabel = ITYPES[inspType].label;

  const baseName = sanitizeFilePart(
    scenario.productName.trim() || scenario.name.trim() || 'qmsr',
  );

  const handlePdf = useCallback(async () => {
    setLoadingPdf(true);
    setError(null);
    try {
      const blob = await pdf(
        <ScenarioPdfDocument
          productTitle={scenario.productName.trim() || 'Untitled product'}
          companyLine={scenario.companyName.trim() || 'Company not set'}
          inspectionTypeLabel={inspectionTypeLabel}
          readinessLabel={overallReadiness.label}
          riskText={scenario.risk}
          narrative={scenario.inspectionNarrative}
          investigatorQuestion={riskThread.investigatorQuestion}
          generatedAt={new Date().toLocaleString()}
        />,
      ).toBlob();
      downloadBlob(blob, `qmsr-export-${baseName}.pdf`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF export failed.';
      setError(message);
    } finally {
      setLoadingPdf(false);
    }
  }, [
    scenario.companyName,
    scenario.inspectionNarrative,
    scenario.productName,
    scenario.risk,
    inspectionTypeLabel,
    overallReadiness.label,
    riskThread.investigatorQuestion,
    baseName,
  ]);

  const handleText = useCallback(() => {
    setError(null);
    const lines: string[] = [
      'QMSR Inspection Readiness — text export',
      `Generated: ${new Date().toISOString()}`,
      '',
      `Product / device: ${scenario.productName.trim() || 'Untitled product'}`,
      `Company: ${scenario.companyName.trim() || 'Company not set'}`,
      `Inspection type: ${inspectionTypeLabel}`,
      `Readiness: ${overallReadiness.label}`,
      '',
      '--- Primary product risk ---',
      scenario.risk.trim() === '' ? '(none)' : scenario.risk.trim(),
      '',
      '--- Investigator outcome question ---',
      riskThread.investigatorQuestion,
      '',
      '--- Inspection narrative ---',
      scenario.inspectionNarrative.trim() === ''
        ? '(none — generate on the Narrative tab)'
        : scenario.inspectionNarrative.trim(),
      '',
      'Educational output only — not legal or regulatory advice.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `qmsr-export-${baseName}.txt`);
  }, [
    scenario.companyName,
    scenario.inspectionNarrative,
    scenario.productName,
    scenario.risk,
    inspectionTypeLabel,
    overallReadiness.label,
    riskThread.investigatorQuestion,
    baseName,
  ]);

  const hasNarrative = scenario.inspectionNarrative.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Deliverables
        </p>
        <h2 className="font-serif text-xl font-semibold text-brand-text md:text-2xl">
          Export
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-brand-muted">
          Download a PDF or plain-text summary of this scenario. The inspection narrative is stored
          with your scenario so it remains available when you switch tabs or come back later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Download report</CardTitle>
          <CardDescription className="text-brand-muted">
            PDF is suitable for sharing; text export works without a PDF engine in the browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void handlePdf()}
              disabled={loadingPdf}
            >
              {loadingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Building PDF…
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" aria-hidden />
                  Download PDF
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleText} disabled={loadingPdf}>
              Download text (.txt)
            </Button>
          </div>
          {!hasNarrative ? (
            <p className="text-sm text-brand-muted" role="status">
              Narrative section is empty — the PDF and text file will still include scenario metadata
              and risk thread. Generate a narrative on the{' '}
              <span className="font-medium text-brand-text">Narrative</span> tab to include it.
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-brand-warn-text" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
