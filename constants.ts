import { ProductCode, ProductType } from './types';

// Embedded Logo (Base64 SVG) - This guarantees it renders in PDF without path issues
export const LOGO_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSIjMTE1NzQwIj4KICA8IS0tIFN0eWxpemVkIEhlbXAvRmliZXIgTGVhZiAtLT4KICA8cGF0aCBkPSRNNTAgMTIuNSBDNDAgNDAgMjUgNTUgMTAgNjUgQzM1IDY1IDQ1IDU1IDUwIDQwIEM1NSA1NSA2NSA2NSA5MCA2NSBDNzUgNTUgNjAgNDAgNTAgMTIuNSBaIiAvPgogIDxwYXRoIGQ9Ik01MCA0NSBDNDggNjAgNDAgODAgMzUgOTUgTDUwIDg1IEw2NSA5NSBDNjAgODAgNTIgNjAgNTAgNDUgWiIgLz4KPC9zdmc+";

export const PRODUCT_TYPES: ProductType[] = [
  { 
    code: ProductCode.LF, 
    name: 'Довге волокно', 
    color: 'bg-blue-100 border-blue-500 text-blue-800' 
  },
  { 
    code: ProductCode.SF, 
    name: 'Коротке волокно', 
    color: 'bg-green-100 border-green-500 text-green-800' 
  },
  { 
    code: ProductCode.CS, 
    name: 'Костра калібрована', 
    color: 'bg-amber-100 border-amber-500 text-amber-800' 
  },
  { 
    code: ProductCode.NS, 
    name: 'Костра некалібрована', 
    color: 'bg-orange-100 border-orange-500 text-orange-800' 
  },
  { 
    code: ProductCode.DS, 
    name: 'Пил костри', 
    color: 'bg-gray-100 border-gray-500 text-gray-800' 
  },
];