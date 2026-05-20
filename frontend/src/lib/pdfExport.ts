/**
 * Compat shim around the new vector PDF pipeline in `./pdf/`.
 *
 * The previous implementation rasterized the on-page React template via
 * html2canvas + jsPDF.  It worked but produced:
 *   - 4-10 MB PDFs (rasterized PNGs per page)
 *   - unselectable / unsearchable text
 *   - mid-row page breaks on long tables
 *   - slow renders on long quotes (DOM walking)
 *
 * The new pipeline uses @react-pdf/renderer to produce a true vector PDF.
 * See ./pdf/QuotationPDF.tsx for the design.
 *
 * We expose the same `exportToPDF(elementId, quote)` signature so the call
 * site in QuoteCard.tsx keeps working with no edit — but `elementId` is now
 * ignored. New call sites should use `exportQuoteAsPDF` directly so they can
 * pass the brand object explicitly.
 */

import type { Quote, BrandSettings } from '@/types/quote';
import { exportQuoteAsPDF } from './pdf';

export { exportQuoteAsPDF } from './pdf';

/**
 * Legacy entry point.  `elementId` is ignored — the new renderer reads from
 * the in-memory Quote model directly rather than rasterizing the DOM.
 *
 * Brand is optional here so the old call site can upgrade incrementally.
 * Without brand we render a neutral fallback document.
 */
export async function exportToPDF(_elementId: string, quote: Quote, brand?: BrandSettings): Promise<void> {
  const effectiveBrand: BrandSettings =
    brand ?? {
      companyName: 'Your Company',
      tagline: '',
      address: '',
      contactPerson: '',
      phone: '',
      whatsapp: '',
      email: '',
      rcNumber: '',
      logoUrl: null,
      docPrimary: '212 100% 41%',
      docSecondary: '213 27% 34%',
      templateStyle: quote.templateStyle,
    };
  await exportQuoteAsPDF(quote, effectiveBrand);
}
