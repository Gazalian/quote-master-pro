import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Quote } from '@/types/quote';

const A4_PX_WIDTH = 794; // 210mm at 96 dpi — standard A4 width

/**
 * Render an element at full A4 width regardless of the current viewport,
 * capture it with html2canvas, and download as a multi-page PDF.
 */
export const exportToPDF = async (elementId: string, quote: Quote): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found for PDF export');

  // Create a wrapper that forces A4 width so the PDF is never narrow/mobile-squashed
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'position:absolute',
    'left:-9999px',
    'top:0',
    `width:${A4_PX_WIDTH}px`,
    `min-width:${A4_PX_WIDTH}px`,
    'background:#ffffff',
    'padding:0',
    'margin:0',
  ].join(';');

  const clone = element.cloneNode(true) as HTMLElement;
  // Remove any overflow-x restrictions that are for mobile display only
  clone.style.cssText = 'width:100%;min-width:0;overflow:visible;';
  // Walk all descendants and remove overflow-x:auto / scroll so tables render fully
  clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
      el.style.overflowX = 'visible';
    }
  });

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2,               // Retina-quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: A4_PX_WIDTH,
      width: A4_PX_WIDTH,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;           // A4 mm
    const pageHeight = 297;         // A4 mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const docType = quote.status === 'INVOICED' ? 'Invoice' : 'Quotation';
    const clientName = (quote.client || 'Client').replace(/[^a-z0-9]/gi, '_');
    const date = new Date().toISOString().split('T')[0];
    pdf.save(`${docType}_${clientName}_${date}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
};

/**
 * Export any element to PDF with a custom filename.
 */
export const exportElementToPDF = async (
  elementId: string,
  filename: string
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found for PDF export');

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:absolute;left:-9999px;top:0;width:${A4_PX_WIDTH}px;min-width:${A4_PX_WIDTH}px;background:#ffffff;`;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.cssText = 'width:100%;min-width:0;overflow:visible;';
  clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
      el.style.overflowX = 'visible';
    }
  });

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: A4_PX_WIDTH,
      width: A4_PX_WIDTH,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(wrapper);
  }
};
