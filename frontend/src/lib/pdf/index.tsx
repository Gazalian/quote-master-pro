/**
 * Public PDF export API.
 *
 * One function: `exportQuoteAsPDF(quote, brand)`.  Produces a vector PDF via
 * @react-pdf/renderer and triggers a browser download.
 *
 * Replaces the old html2canvas + jsPDF pipeline.  Old call signature
 * `exportToPDF(elementId, quote)` is preserved in `pdfExport.ts` as a thin
 * compat shim that ignores the elementId — call sites do not need to change
 * to upgrade, though the brand-aware variant is preferred for new code.
 */

import { pdf } from '@react-pdf/renderer';
import type { Quote, BrandSettings } from '@/types/quote';
import { QuotationPDF } from './QuotationPDF';
import { safeFileName } from './formatters';

export interface ExportOptions {
  /** Override the auto-generated filename. */
  filename?: string;
}

export async function exportQuoteAsPDF(
  quote: Quote,
  brand: BrandSettings,
  options: ExportOptions = {},
): Promise<void> {
  const docType = quote.status === 'INVOICED' ? 'Invoice' : 'Quotation';
  const filename =
    options.filename ?? safeFileName({ docType, client: quote.client, date: new Date() });

  const blob = await pdf(<QuotationPDF quote={quote} brand={brand} />).toBlob();
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick before revoking — Safari race-conditions otherwise.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
