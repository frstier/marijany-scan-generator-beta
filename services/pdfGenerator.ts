import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LabelData } from '../types';

export const generateAndPrintPDF = async (data: LabelData) => {
  // Determine which DOM element to capture based on the selected size
  const elementId = data.size === '58x30' ? 'label-content-58' : 'label-content-100';
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Label element with id ${elementId} not found`);
    alert('Помилка: Не вдалося знайти шаблон етикетки для друку.');
    return;
  }

  try {
    // Capture the element as a high-quality image
    const canvas = await html2canvas(element, {
      scale: 4, // High resolution for crisp printing
      useCORS: true, // Allow loading cross-origin images (like external logos if any)
      backgroundColor: '#ffffff', // Ensure white background
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');

    // Define PDF dimensions (mm)
    const isSmall = data.size === '58x30';
    const pdfWidth = isSmall ? 58 : 100;
    const pdfHeight = isSmall ? 30 : 100;

    const doc = new jsPDF({
      orientation: isSmall ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    // Add the captured image to the PDF
    // We stretch it slightly to fit the full PDF area (0, 0, width, height)
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Output
    doc.autoPrint();
    const pdfBlob = doc.output('bloburl');
    window.open(pdfBlob, '_blank');

  } catch (error) {
    console.error('PDF Generation failed:', error);
    alert('Помилка при створенні PDF файлу.');
  }
};