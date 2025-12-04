
import React, { useState, useMemo } from 'react';
import { PRODUCT_TYPES, LOGO_BASE64 } from './constants';
import { ProductCode, LabelData, LabelSize, PrintMode } from './types';
import { generateZPL, downloadZplFile } from './services/zplGenerator';
import { generateAndPrintPDF } from './services/pdfGenerator';
import { zebraClient } from './services/bluetoothService';
import { BarcodeDisplay } from './components/BarcodeDisplay';
import { NumericKeypad } from './components/NumericKeypad';
import { Printer, Scale, Calendar, Hash, ChevronDown, Pencil, Check, X, Settings, XCircle, Eye, Bluetooth, BluetoothConnected, Smartphone, Radio, FileText, Usb } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [currentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [selectedProduct, setSelectedProduct] = useState<ProductCode>(ProductCode.LF);
  const [weight, setWeight] = useState<string>('');
  const [sequenceNumber, setSequenceNumber] = useState<number>(1);
  const [isEditingSequence, setIsEditingSequence] = useState<boolean>(false);
  const [manualSequenceInput, setManualSequenceInput] = useState<string>('1');
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'connection'>('general');
  const [labelSize, setLabelSize] = useState<LabelSize>('58x30'); // Default to small
  const [printMode, setPrintMode] = useState<PrintMode>('pdf'); // Default to PDF for testing/system print

  // Bluetooth State
  const [isPrinterConnected, setIsPrinterConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string>('');
  const [targetDeviceName, setTargetDeviceName] = useState<string>(() => {
    return localStorage.getItem('zebra_target_name') || '';
  });

  // --- Derived State (Logic) ---
  const { article, barcodeValue } = useMemo(() => {
    const datePart = currentDate.replace(/-/g, ''); 
    const seqPart = sequenceNumber.toString().padStart(3, '0');
    
    // Human readable short ID (e.g. LF-20231025-001)
    const art = `${selectedProduct}-${datePart}-${seqPart}`;
    
    // Machine readable barcode (Date-Type-Seq-Weight)
    // Example: 20231025-LF-001-15.5
    const w = weight || '0';
    const bar = `${datePart}-${selectedProduct}-${seqPart}-${w}`;
    
    return { article: art, barcodeValue: bar };
  }, [selectedProduct, currentDate, sequenceNumber, weight]);

  const labelData: LabelData = {
    date: currentDate,
    productCode: selectedProduct,
    sequenceNumber,
    weight: parseFloat(weight) || 0,
    article,
    barcodeValue,
    size: labelSize
  };

  const currentProductDetails = PRODUCT_TYPES.find(p => p.code === selectedProduct);

  // --- Handlers ---
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProduct(e.target.value as ProductCode);
  };

  const handleKeypadPress = (key: string) => {
    if (key === '.') {
      if (weight.includes('.')) return;
      if (weight === '') {
        setWeight('0.');
        return;
      }
    }
    if (weight.includes('.')) {
      const [_, decimal] = weight.split('.');
      if (decimal && decimal.length >= 2) return;
    }
    setWeight(prev => prev + key);
  };

  const handleKeypadDelete = () => {
    setWeight(prev => prev.slice(0, -1));
  };

  const handleIncrement = () => setSequenceNumber(prev => prev + 1);
  const handleDecrement = () => setSequenceNumber(prev => Math.max(1, prev - 1));

  const handlePrintSuccess = () => {
    setTimeout(() => {
      setSequenceNumber(prev => prev + 1);
      setWeight(''); // Clear weight after print to prevent errors
    }, 500);
  };

  const handleConnectPrinter = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      await zebraClient.connect(targetDeviceName || undefined);
      setIsPrinterConnected(true);
      setConnectedDeviceName(zebraClient.getDeviceName());
      setPrintMode('zpl'); // Auto switch to ZPL mode if connected
    } catch (error: any) {
      console.error(error);
      setConnectionError('Помилка підключення. Перевірте, чи принтер увімкнено та чи це модель серії ZD.');
      setIsPrinterConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectPrinter = () => {
    zebraClient.disconnect();
    setIsPrinterConnected(false);
    setConnectedDeviceName('');
  };

  const handleSaveTargetName = (name: string) => {
    setTargetDeviceName(name);
    localStorage.setItem('zebra_target_name', name);
  };

  const handlePrint = async () => {
    if (printMode === 'pdf') {
      // PDF / System Print Mode
      // We await this because generateAndPrintPDF is now async (uses html2canvas)
      await generateAndPrintPDF(labelData);
      handlePrintSuccess();
    } else {
      // Bluetooth / ZPL Mode
      const zpl = generateZPL(labelData);
      if (isPrinterConnected) {
        try {
          await zebraClient.print(zpl);
          handlePrintSuccess();
        } catch (error) {
          console.error('Print failed:', error);
          alert('Помилка друку через Bluetooth. Перевірте з\'єднання.');
        }
      } else {
        // Fallback or explicit user action for ZPL download if not connected
        if (confirm('Принтер не підключено по Bluetooth. Скачати ZPL файл?')) {
           downloadZplFile(zpl, `label-${article}.zpl`);
           handlePrintSuccess();
        }
      }
    }
  };

  // Manual Sequence Editing
  const startEditingSequence = () => {
    setManualSequenceInput(sequenceNumber.toString());
    setIsEditingSequence(true);
  };
  const cancelEditingSequence = () => setIsEditingSequence(false);
  const saveSequenceNumber = () => {
    const newNum = parseInt(manualSequenceInput, 10);
    if (!isNaN(newNum) && newNum > 0) {
      setSequenceNumber(newNum);
      setIsEditingSequence(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative transition-colors duration-200" style={{ backgroundColor: '#D9D9D6' }}>
      
      {/* --- Settings Modal --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
             {/* Modal Header */}
             <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-100">
               <h2 className="text-xl font-bold text-[#115740] flex items-center gap-2">
                 <Settings size={20} />
                 Налаштування
               </h2>
               <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                 <XCircle size={24} />
               </button>
             </div>

             {/* Tabs */}
             <div className="flex border-b border-gray-200">
                <button 
                  onClick={() => setActiveSettingsTab('general')}
                  className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${activeSettingsTab === 'general' ? 'text-[#115740] border-b-2 border-[#115740]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Загальні
                </button>
                <button 
                  onClick={() => setActiveSettingsTab('connection')}
                  className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${activeSettingsTab === 'connection' ? 'text-[#115740] border-b-2 border-[#115740]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Підключення
                </button>
             </div>

             {/* Modal Body */}
             <div className="p-6 overflow-y-auto">
               
               {/* --- General Tab --- */}
               {activeSettingsTab === 'general' && (
                 <div className="space-y-4">
                   <label className="block text-sm font-medium text-gray-700">Розмір етикетки</label>
                   <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={() => setLabelSize('58x30')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${labelSize === '58x30' ? 'border-[#115740] bg-[#115740]/5 text-[#115740]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                     >
                       <div className="w-12 h-6 border-2 border-current rounded border-dashed"></div>
                       <span className="font-bold">58x30 мм</span>
                     </button>

                     <button 
                        onClick={() => setLabelSize('100x100')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${labelSize === '100x100' ? 'border-[#115740] bg-[#115740]/5 text-[#115740]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                     >
                       <div className="w-8 h-8 border-2 border-current rounded border-dashed"></div>
                       <span className="font-bold">100x100 мм</span>
                     </button>
                   </div>
                 </div>
               )}

               {/* --- Connection Tab --- */}
               {activeSettingsTab === 'connection' && (
                 <div className="space-y-6">
                    
                    {/* Print Mode Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Режим друку</label>
                      <div className="grid grid-cols-1 gap-3">
                         {/* Option 1: PDF/System */}
                         <button 
                            onClick={() => setPrintMode('pdf')}
                            className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${printMode === 'pdf' ? 'border-[#115740] bg-[#115740]/5 text-[#115740]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                         >
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <FileText size={20} />
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-sm">Системний друк (PDF)</div>
                              <div className="text-[10px] text-gray-400">USB, WiFi, Мережеві принтери</div>
                            </div>
                            {printMode === 'pdf' && <Check size={16} className="ml-auto" />}
                         </button>

                         {/* Option 2: Zebra Direct */}
                         <button 
                            onClick={() => setPrintMode('zpl')}
                            className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${printMode === 'zpl' ? 'border-[#115740] bg-[#115740]/5 text-[#115740]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                         >
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Bluetooth size={20} />
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-sm">Direct Zebra (ZPL)</div>
                              <div className="text-[10px] text-gray-400">Тільки Bluetooth (Android/Chrome)</div>
                            </div>
                             {printMode === 'zpl' && <Check size={16} className="ml-auto" />}
                         </button>
                      </div>
                    </div>

                    {/* Zebra Specific Controls (Only if ZPL mode selected) */}
                    {printMode === 'zpl' && (
                      <div className="animate-in fade-in slide-in-from-top-2 pt-4 border-t border-gray-100">
                        <div className="text-center mb-4">
                          <h3 className="font-bold text-gray-900 flex items-center justify-center gap-2">
                            {isPrinterConnected ? <BluetoothConnected className="text-green-500" /> : <Bluetooth className="text-gray-400" />}
                            {isPrinterConnected ? 'Zebra підключена' : 'Zebra не підключена'}
                          </h3>
                          {isPrinterConnected && (
                            <p className="text-sm text-[#115740] font-medium">{connectedDeviceName}</p>
                          )}
                        </div>

                        {/* Exact Name Input */}
                        <div className="mb-4">
                          <label className="block text-xs text-gray-500 mb-1">Точне ім'я принтера (опціонально)</label>
                          <input 
                            type="text" 
                            placeholder="Напр: 50J193901234"
                            value={targetDeviceName}
                            onChange={(e) => handleSaveTargetName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Введіть серійний номер, щоб пришвидшити пошук</p>
                        </div>

                        {connectionError && (
                          <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-xs mb-3">
                            {connectionError}
                          </div>
                        )}

                        {!isPrinterConnected ? (
                          <button 
                            onClick={handleConnectPrinter}
                            disabled={isConnecting}
                            className="w-full py-3 rounded-xl font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                            style={{ backgroundColor: '#115740' }}
                          >
                            {isConnecting ? (
                              <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                <span>Пошук...</span>
                              </>
                            ) : (
                              <>
                                <Bluetooth size={18} />
                                <span>Знайти принтер</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button 
                            onClick={handleDisconnectPrinter}
                            className="w-full py-3 rounded-xl font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                          >
                            Відключити
                          </button>
                        )}
                        <p className="text-[10px] text-gray-400 text-center mt-2">
                          Для режиму ZPL потрібен браузер Chrome та увімкнений Bluetooth
                        </p>
                      </div>
                    )}
                 </div>
               )}
             </div>

             <div className="p-4 bg-gray-50 border-t border-gray-100">
               <button 
                 onClick={() => setIsSettingsOpen(false)}
                 className="w-full py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
               >
                 Закрити
               </button>
             </div>
          </div>
        </div>
      )}

      {/* --- Header --- */}
      <header className="w-full shadow-md p-4 sticky top-0 z-20 no-print" style={{ backgroundColor: '#115740' }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo placeholder - Title removed */}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Settings size={28} />
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="w-full max-w-md p-4 space-y-4 no-print pb-32">
        
        {/* Product Selector */}
        <section className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
           <div className="flex items-center justify-between text-xs text-gray-400 mb-2 border-b border-gray-100 pb-2">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{currentDate}</span>
              </div>
              <span className="bg-gray-100 px-2 rounded-full text-[10px] font-bold text-gray-500">ТИП</span>
           </div>

           <div className="relative group">
            <select
              value={selectedProduct}
              onChange={handleProductChange}
              className="w-full appearance-none bg-transparent text-gray-900 text-lg font-bold pr-8 focus:outline-none cursor-pointer"
            >
              {PRODUCT_TYPES.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.code} - {type.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
              <ChevronDown size={20} />
            </div>
          </div>
        </section>

        {/* Sequence Number */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
           <div className="flex items-center justify-between text-gray-700 mb-2">
             <div className="flex items-center gap-2">
                <Hash size={18} />
                <span className="text-sm font-medium uppercase text-gray-500">№ Партії</span>
             </div>
             
             {!isEditingSequence ? (
               <button onClick={startEditingSequence} className="text-[#115740] hover:opacity-70 transition-opacity"><Pencil size={16} /></button>
             ) : (
               <button onClick={cancelEditingSequence} className="text-red-500"><X size={16} /></button>
             )}
          </div>

          {isEditingSequence ? (
            <div className="flex items-center gap-2 h-12">
              <input 
                type="number"
                value={manualSequenceInput}
                onChange={(e) => setManualSequenceInput(e.target.value)}
                className="w-full h-full border-2 rounded-lg text-xl font-mono text-center focus:outline-none"
                style={{ borderColor: '#115740', color: '#115740' }}
                autoFocus
              />
              <button onClick={saveSequenceNumber} className="h-12 w-12 flex items-center justify-center text-white rounded-lg" style={{ backgroundColor: '#115740' }}>
                <Check size={24} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-200">
              <button onClick={handleDecrement} className="h-12 w-14 flex items-center justify-center bg-white rounded shadow-sm border border-gray-200 text-xl font-bold text-gray-600 active:scale-95 transition-transform">-</button>
              <span className="text-2xl font-bold font-mono text-gray-900">{sequenceNumber}</span>
              <button onClick={handleIncrement} className="h-12 w-14 flex items-center justify-center bg-white rounded shadow-sm border border-gray-200 text-xl font-bold text-gray-600 active:scale-95 transition-transform">+</button>
            </div>
          )}
        </section>

        {/* Weight Display */}
        <section className="bg-white p-4 rounded-xl shadow-sm border-2 ring-4 relative overflow-hidden" 
          style={{ borderColor: '#115740', '--tw-ring-color': 'rgba(17, 87, 64, 0.1)' } as React.CSSProperties}
        >
           <div className="flex items-center justify-between text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <Scale size={18} className="text-[#115740]" />
              <span className="text-sm font-bold uppercase text-[#115740]">Вага (кг)</span>
            </div>
          </div>
          
          <div className="w-full h-16 flex items-center justify-end text-4xl font-mono font-bold tracking-tight text-gray-900">
            {weight ? (
              <>
                {weight}<span className="animate-pulse ml-0.5" style={{ color: '#CB8E0B' }}>|</span>
              </>
            ) : (
              <span className="text-gray-300">0.00</span>
            )}
          </div>
        </section>

        {/* Inline Keypad */}
        <section>
          <NumericKeypad 
            onKeyPress={handleKeypadPress}
            onDelete={handleKeypadDelete}
          />
        </section>

        {/* Preview Section - Moved to bottom */}
        <div className="border-t border-gray-300 pt-6 mt-2">
          <div className="flex items-center justify-center gap-2 mb-2 text-gray-500">
             <Eye size={14} />
             <span className="text-xs font-bold uppercase tracking-wider">Попередній перегляд</span>
          </div>
          <section className="flex justify-center">
            <div 
              className="bg-white shadow-md border border-gray-200 rounded p-1 relative transition-all duration-300 overflow-hidden flex flex-col justify-center items-center"
              style={{
                width: labelSize === '58x30' ? '280px' : '300px',
                aspectRatio: labelSize === '58x30' ? '58/30' : '1/1',
              }}
            >
              {/* --- 58x30 Layout (Redesigned for fit) --- */}
              {labelSize === '58x30' && (
                <div id="label-content-58" className="flex flex-col w-full h-full bg-white font-sans text-gray-900">
                  {/* Top: Product Name (Centered, Full Width) - RESERVED FIXED HEIGHT */}
                  <div className="flex items-center justify-center min-h-[34px] text-center pt-2 px-1">
                    <span className="font-bold text-[11px] leading-tight break-words">
                      {currentProductDetails?.name}
                    </span>
                  </div>
                  
                  {/* Middle: Weight & Batch (Flex Row) - Pushed down */}
                  <div className="flex justify-between items-center px-2 mt-1">
                     <span className="font-bold text-[10px] whitespace-nowrap">{weight || '0.00'} кг</span>
                     <span className="font-bold text-[10px] whitespace-nowrap">Партія: {sequenceNumber}</span>
                  </div>

                   {/* Date: Centered Small */}
                  <div className="text-center text-[9px] text-gray-600 leading-none mt-1">
                    {currentDate}
                  </div>

                  {/* Bottom: Barcode */}
                  <div className="mt-auto mb-1 w-full flex justify-center overflow-hidden">
                    <BarcodeDisplay 
                      value={barcodeValue} 
                      height={20} // Reduced height
                      fontSize={10} // Reduced font
                      width={1.5} // Slightly thinner bars
                      margin={0} // No margins to avoid white strips
                    />
                  </div>
                </div>
              )}

              {/* --- 100x100 Layout --- */}
              {labelSize === '100x100' && (
                <div id="label-content-100" className="flex flex-col h-full w-full font-sans text-gray-900 p-2 bg-white">
                  {/* Logo and Product Name Header */}
                  <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2 mb-4 h-16">
                     <img 
                       src={LOGO_BASE64}
                       alt="MA'RIJANY" 
                       className="h-full w-auto object-contain"
                     />
                     <div className="text-xl font-bold text-right flex items-center h-full">
                       {currentProductDetails?.name}
                     </div>
                  </div>
                  
                  {/* Columns */}
                  <div className="grid grid-cols-2 gap-4 text-sm flex-grow">
                    <div className="space-y-4">
                       <div>
                        <span className="text-gray-500 text-xs uppercase block">Тип продукції</span>
                        <span className="font-bold text-lg">{currentProductDetails?.name}</span>
                       </div>
                       <div>
                        <span className="text-gray-500 text-xs uppercase block">Партія №</span>
                        <span className="font-bold text-lg">{sequenceNumber}</span>
                       </div>
                    </div>
                    <div className="space-y-4 text-right">
                       <div>
                        <span className="text-gray-500 text-xs uppercase block">Вага (Нетто)</span>
                        <span className="font-bold text-2xl">{weight || '0.00'} кг</span>
                       </div>
                       <div>
                        <span className="text-gray-500 text-xs uppercase block">Дата виготовлення</span>
                        <span className="font-bold text-lg">{currentDate}</span>
                       </div>
                    </div>
                  </div>

                  {/* Barcode */}
                  <div className="mt-4 pt-4 border-t-2 border-gray-100 flex justify-center">
                    <BarcodeDisplay value={barcodeValue} height={60} fontSize={14} width={2} margin={5} />
                  </div>
                </div>
              )}

            </div>
          </section>
        </div>

      </main>

      {/* --- Sticky Footer Actions --- */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-pb no-print z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto grid grid-cols-1 gap-3">
          <button
            onClick={handlePrint}
            disabled={!weight}
            className={`
              flex items-center justify-center gap-2 h-14 rounded-xl font-bold text-white text-lg active:scale-95 transition-transform shadow-lg
              ${!weight ? 'bg-gray-400 cursor-not-allowed' : 'hover:opacity-90'}
            `}
            style={{ backgroundColor: !weight ? undefined : '#115740' }}
          >
             {printMode === 'pdf' ? (
               <Printer size={24} />
             ) : (
               isPrinterConnected ? <Smartphone size={24} /> : <Bluetooth size={24} />
             )}
             
             <span>
               {printMode === 'pdf' ? `ДРУК PDF (${labelSize})` : 
                 isPrinterConnected ? `ДРУК BT (${labelSize})` : `СКАЧАТИ ZPL (${labelSize})`
               }
             </span>
          </button>
        </div>
      </footer>

    </div>
  );
};

export default App;
