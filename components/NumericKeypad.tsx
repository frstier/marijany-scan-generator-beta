import React from 'react';
import { Delete } from 'lucide-react';

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({ 
  onKeyPress, 
  onDelete
}) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="w-full max-w-md mx-auto mt-2">
      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-3">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="h-14 rounded-xl text-2xl font-bold transition-opacity hover:opacity-90 active:opacity-70 shadow-sm"
            style={{ 
              backgroundColor: '#CB8E0B', 
              color: 'white' 
            }}
          >
            {key}
          </button>
        ))}
        
        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="h-14 rounded-xl bg-white text-red-500 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
        >
          <Delete size={24} />
        </button>
      </div>
    </div>
  );
};