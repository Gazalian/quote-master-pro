import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Quote } from '@/types/quote';

/**
 * Export a quote/invoice to PDF
 * @param elementId - The ID of the HTML element to convert to PDF
 * @param quote - The quote object for filename generation
 * @returns Promise<void>
 */
export const exportToPDF = async (elementId: string, quote: Quote): Promise<void> => {
  try {
    const element = document.getElementById(elementId);

    if (!element) {
      throw new Error('Element not found for PDF export');
    }

    // Create a clone to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    document.body.appendChild(clone);

    // Capture the element as canvas with high quality
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher quality
      useCORS: true, // Allow cross-origin images
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Remove the clone
    document.body.removeChild(clone);

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png');

    // Calculate PDF dimensions (A4 size)
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename
    const docType = quote.status === 'INVOICED' ? 'Invoice' : 'Quotation';
    const clientName = quote.client.replace(/[^a-z0-9]/gi, '_');
    const date = new Date().toISOString().split('T')[0];
    const filename = `${docType}_${clientName}_${date}.pdf`;

    // Download the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

/**
 * Export element to PDF with custom filename
 */
export const exportElementToPDF = async (
  elementId: string,
  filename: string
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);

    if (!element) {
      throw new Error('Element not found for PDF export');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
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
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};
