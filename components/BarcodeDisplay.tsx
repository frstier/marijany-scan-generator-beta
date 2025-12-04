
import React from 'react';
import Barcode from 'react-barcode';

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  margin?: number;
}

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({ 
  value, 
  width = 2, 
  height = 60, 
  fontSize = 14,
  margin = 5
}) => {
  return (
    <div className="w-full flex justify-center overflow-hidden">
      <Barcode 
        value={value}
        width={width}
        height={height}
        fontSize={fontSize}
        displayValue={true}
        margin={margin}
        background="#ffffff"
      />
    </div>
  );
};
