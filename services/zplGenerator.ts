import { LabelData } from '../types';
import { PRODUCT_TYPES } from '../constants';

/**
 * Generates ZPL II code based on selected label size.
 * 203 DPI printer assumption (8 dots per mm).
 */
export const generateZPL = (data: LabelData): string => {
  const productName = PRODUCT_TYPES.find(p => p.code === data.productCode)?.name || 'Unknown';
  
  // Format date for display (DD.MM.YYYY)
  const dateObj = new Date(data.date);
  const displayDate = dateObj.toLocaleDateString('uk-UA');

  if (data.size === '58x30') {
    return generateSmallLabel(data, productName, displayDate);
  } else {
    return generateLargeLabel(data, productName, displayDate);
  }
};

/**
 * 58mm x 30mm Label (Approx 464 dots x 240 dots)
 * Compact layout suitable for small stickers.
 * Layout:
 * Top: Product Name
 * Mid: Type | Weight | Batch | Date
 * Bottom: Barcode
 */
const generateSmallLabel = (data: LabelData, productName: string, displayDate: string): string => {
  // Adjusted X coordinates to allow more space for the full Product Name
  return `
^XA
^PW464
^LL240
^CI28

^FO10,10
^A0N,25,25
^FD${productName}^FS

^FO10,45
^A0N,20,20
^FD${productName}^FS

^FO160,45
^A0N,20,20
^FD${data.weight}kg^FS

^FO260,45
^A0N,20,20
^FDПарт: ${data.sequenceNumber}^FS

^FO360,45
^A0N,20,20
^FD${displayDate}^FS

^FO10,80
^BY2,3,60
^BCN,60,Y,N,N
^FD${data.barcodeValue}^FS

^XZ
  `.trim();
};

/**
 * 100mm x 100mm Label (Approx 800 dots x 800 dots)
 * Spacious layout for pallet labeling.
 * Columns: Type - Weight - Batch - Date
 */
const generateLargeLabel = (data: LabelData, productName: string, displayDate: string): string => {
  return `
^XA
^PW800
^LL800
^CI28

^FO30,30
^A0N,60,60
^FD${productName}^FS

^FO30,120
^A0N,40,40
^FDТип: ${productName}^FS

^FO400,120
^A0N,40,40
^FDВага: ${data.weight} кг^FS

^FO30,200
^A0N,40,40
^FDПартія: ${data.sequenceNumber}^FS

^FO400,200
^A0N,40,40
^FDДата: ${displayDate}^FS

^FO50,350
^BY3,3,200
^BCN,200,Y,N,N
^FD${data.barcodeValue}^FS

^XZ
  `.trim();
};

export const downloadZplFile = (zplContent: string, filename: string) => {
  const blob = new Blob([zplContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};