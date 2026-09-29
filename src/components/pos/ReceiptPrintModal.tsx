'use client';

import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData?: any;
  session?: any;
  cartItems?: any[];
  posConfig?: any;
  grandTotalBDT?: number;
  paymentMethod?: string;
  amountPaidBDT?: number;
  changeDueBDT?: number;
  customerName?: string;
  customerPhone?: string;
}

export function ReceiptPrintModal({
  isOpen,
  onClose,
  saleData,
  session,
  cartItems = [],
  posConfig = {},
  grandTotalBDT = 0,
  paymentMethod = 'CASH',
  amountPaidBDT = 0,
  changeDueBDT = 0,
  customerName,
  customerPhone,
}: ReceiptPrintModalProps) {
  if (!isOpen) return null;

  const receiptNumber = saleData?.receipt_number || `RCP-RST-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const tableName = session?.table?.name || (session?.table?.table_number ? `Table ${session.table.table_number}` : 'Counter Takeaway');

  const subtotalBDT = cartItems.reduce((sum, item) => {
    const modPrice = item.modifiers ? item.modifiers.reduce((s: number, m: any) => s + (m.price || 0), 0) : 0;
    return sum + ((item.unit_price + modPrice) * item.quantity) / 100;
  }, 0);

  const serviceChargePct = posConfig.service_charge_enabled !== false ? Number(posConfig.service_charge_pct || 0) : 0;
  const serviceChargeBDT = (subtotalBDT * serviceChargePct) / 100;
  const taxPct = Number(posConfig.tax_rate_pct || 0);
  const taxBDT = ((subtotalBDT + serviceChargeBDT) * taxPct) / 100;
  const calculatedGrandTotalBDT = grandTotalBDT || (subtotalBDT + serviceChargeBDT + taxBDT);

  const handlePrint = () => {
    const printArea = document.getElementById('pos-thermal-print-area');
    if (!printArea) {
      window.print();
      return;
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';

    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt ${receiptNumber}</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                font-family: monospace, Courier, sans-serif;
                font-size: 11px;
                color: #000;
                background: #fff;
                margin: 0;
                padding: 4mm;
                width: 80mm;
                box-sizing: border-box;
              }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .font-black { font-weight: 900; }
              .uppercase { text-transform: uppercase; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .border-b { border-bottom: 1px dashed #000; }
              .pb-2 { padding-bottom: 8px; }
              .pt-1 { padding-top: 4px; }
              .py-1 { padding-top: 4px; padding-bottom: 4px; }
              .space-y-05 > * + * { margin-top: 2px; }
              .space-y-1 > * + * { margin-top: 4px; }
              .space-y-2 > * + * { margin-top: 8px; }
              .pl-2 { padding-left: 8px; }
              .italic { font-style: italic; }
            </style>
          </head>
          <body>
            ${printArea.innerHTML}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 1000);
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-stone-900/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal / Print Sheet */}
      <div className="relative bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-0 text-stone-900 dark:text-slate-100 z-10 transition-colors duration-200">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-stone-200 dark:border-slate-800 flex justify-between items-center bg-stone-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-stone-900 dark:text-white">Thermal Receipt Preview</h3>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Screen Receipt Preview Box */}
        <div className="p-6 bg-stone-100 dark:bg-slate-950 text-stone-900 dark:text-slate-200 font-mono text-xs max-h-[70vh] overflow-y-auto custom-scrollbar flex justify-center">
          <div className="w-[300px] bg-white text-black p-4 rounded-xl shadow-lg space-y-3 font-mono leading-tight border border-stone-200">
            {/* Logo / Restaurant Header */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-gray-400">
              <h2 className="font-black text-base uppercase tracking-wider">BOS RESTAURANT</h2>
              <p className="text-[10px] text-gray-600">Dhaka Flagship Branch</p>
              <p className="text-[10px] text-gray-600">BIN: 004829104-0101</p>
              <p className="text-[10px] text-gray-500 pt-1">{dateStr} • {timeStr}</p>
            </div>

            {/* Receipt Meta */}
            <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-bold">{tableName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-bold uppercase">{paymentMethod}</span>
              </div>
              {(customerName || customerPhone) && (
                <div className="flex justify-between">
                  <span>Guest:</span>
                  <span className="font-bold">{customerName || 'Guest'} {customerPhone ? `(${customerPhone})` : ''}</span>
                </div>
              )}
            </div>

            {/* Itemized Dish List */}
            <div className="space-y-2 py-1 border-b border-dashed border-gray-400">
              <div className="flex justify-between font-bold text-[10px] border-b border-gray-200 pb-1">
                <span>QTY / DISH</span>
                <span>AMOUNT</span>
              </div>

              {cartItems.map((item: any, idx: number) => {
                const modPrice = item.modifiers ? item.modifiers.reduce((s: number, m: any) => s + (m.price || 0), 0) : 0;
                const itemTotalBDT = ((item.unit_price + modPrice) * item.quantity) / 100;

                return (
                  <div key={idx} className="text-[11px] space-y-0.5">
                    <div className="flex justify-between items-start font-bold">
                      <span>{item.quantity}x {item.name}</span>
                      <span>৳{itemTotalBDT.toFixed(2)}</span>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-[9px] text-gray-600 pl-3">
                        + {item.modifiers.map((m: any) => m.name).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[9px] text-gray-500 italic pl-3">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals Breakdown */}
            <div className="text-[10px] space-y-1 pt-1 pb-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>৳{subtotalBDT.toFixed(2)}</span>
              </div>
              {serviceChargeBDT > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge ({serviceChargePct}%):</span>
                  <span>৳{serviceChargeBDT.toFixed(2)}</span>
                </div>
              )}
              {taxBDT > 0 && (
                <div className="flex justify-between">
                  <span>VAT ({taxPct}%):</span>
                  <span>৳{taxBDT.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black pt-1 border-t border-gray-300">
                <span>TOTAL PAYABLE:</span>
                <span>৳{calculatedGrandTotalBDT.toFixed(2)}</span>
              </div>
            </div>

            {/* Tender & Change */}
            <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span>৳{(amountPaidBDT || calculatedGrandTotalBDT).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Change Due:</span>
                <span>৳{(changeDueBDT || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] text-gray-500 pt-2 space-y-0.5">
              <p className="font-bold">Thank you for dining with us!</p>
              <p>Please come again.</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950/60 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Done
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center space-x-1.5 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print 80mm Receipt</span>
          </button>
        </div>
      </div>

      {/* Hidden Print Content Container for Iframe Injector */}
      <div id="pos-thermal-print-area" className="hidden">
        <div className="text-center space-y-1 pb-2 border-b">
          <h2 className="font-black text-base uppercase">BOS RESTAURANT</h2>
          <p className="text-[10px]">Dhaka Flagship Branch</p>
          <p className="text-[10px]">BIN: 004829104-0101</p>
          <p className="text-[10px] pt-1">{dateStr} • {timeStr}</p>
        </div>

        <div className="text-[10px] space-y-05 pb-2 border-b">
          <div className="flex justify-between">
            <span>Receipt #:</span>
            <span className="font-bold">{receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Location:</span>
            <span className="font-bold">{tableName}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment:</span>
            <span className="font-bold uppercase">{paymentMethod}</span>
          </div>
          {(customerName || customerPhone) && (
            <div className="flex justify-between">
              <span>Guest:</span>
              <span className="font-bold">{customerName || 'Guest'} {customerPhone ? `(${customerPhone})` : ''}</span>
            </div>
          )}
        </div>

        <div className="space-y-1 py-1 border-b">
          <div className="flex justify-between font-bold text-[10px] pb-1">
            <span>QTY / DISH</span>
            <span>AMOUNT</span>
          </div>
          {cartItems.map((item: any, idx: number) => {
            const modPrice = item.modifiers ? item.modifiers.reduce((s: number, m: any) => s + (m.price || 0), 0) : 0;
            const itemTotalBDT = ((item.unit_price + modPrice) * item.quantity) / 100;
            return (
              <div key={idx} className="text-[11px] space-y-05">
                <div className="flex justify-between font-bold">
                  <span>{item.quantity}x {item.name}</span>
                  <span>৳{itemTotalBDT.toFixed(2)}</span>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-[9px] pl-2">+ {item.modifiers.map((m: any) => m.name).join(', ')}</p>
                )}
                {item.notes && <p className="text-[9px] italic pl-2">Note: {item.notes}</p>}
              </div>
            );
          })}
        </div>

        <div className="text-[10px] space-y-1 pt-1 pb-2 border-b">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>৳{subtotalBDT.toFixed(2)}</span>
          </div>
          {serviceChargeBDT > 0 && (
            <div className="flex justify-between">
              <span>Service Charge ({serviceChargePct}%):</span>
              <span>৳{serviceChargeBDT.toFixed(2)}</span>
            </div>
          )}
          {taxBDT > 0 && (
            <div className="flex justify-between">
              <span>VAT ({taxPct}%):</span>
              <span>৳{taxBDT.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-black pt-1">
            <span>TOTAL PAYABLE:</span>
            <span>৳{calculatedGrandTotalBDT.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-[10px] space-y-05 pb-2 border-b">
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>৳{(amountPaidBDT || calculatedGrandTotalBDT).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Change Due:</span>
            <span>৳{(changeDueBDT || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center text-[9px] pt-2 space-y-05">
          <p className="font-bold">Thank you for dining with us!</p>
          <p>Please come again.</p>
        </div>
      </div>
    </div>
  );
}
