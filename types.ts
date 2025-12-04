export enum ProductCode {
  LF = 'LF', // Довге волокно
  SF = 'SF', // Коротке волокно
  CS = 'CS', // Костра калібрована
  NS = 'NS', // Костра некалібрована
  DS = 'DS'  // Пил костри
}

export type LabelSize = '58x30' | '100x100';

export type PrintMode = 'pdf' | 'zpl';

export interface ProductType {
  code: ProductCode;
  name: string;
  color: string;
}

export interface LabelData {
  date: string;       // YYYY-MM-DD
  productCode: ProductCode;
  sequenceNumber: number;
  weight: number;     // in kg
  article: string;    // Human readable SKU (Type-Date-Seq)
  barcodeValue: string; // Machine readable (Date-Type-Seq-Weight)
  size: LabelSize;
}