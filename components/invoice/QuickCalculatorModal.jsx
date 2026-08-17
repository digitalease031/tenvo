'use client';

import React, { useState, useEffect } from 'react';
import { X, Delete, Check, Calculator as CalcIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * QuickCalculatorModal Component
 * Interactive mini calculator keypad modal for invoice builder fields.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(val: number) => void} props.onApply
 * @param {string} [props.title] - Field title (e.g., 'Quantity', 'Rate', 'Amount')
 * @param {number|string} [props.initialValue]
 */
export function QuickCalculatorModal({
  isOpen,
  onClose,
  onApply,
  title = 'Calculator',
  initialValue = 0,
}) {
  const [display, setDisplay] = useState(String(initialValue ?? 0));
  const [history, setHistory] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDisplay(String(initialValue ?? 0));
      setHistory('');
    }
  }, [isOpen, initialValue]);

  const handleKeyPress = (key) => {
    if (key === 'C') {
      setDisplay('0');
      setHistory('');
      return;
    }

    if (key === 'DEL') {
      if (display.length <= 1 || display === 'Error') {
        setDisplay('0');
      } else {
        setDisplay(display.slice(0, -1));
      }
      return;
    }

    if (key === '=') {
      calculateResult();
      return;
    }

    // Number or operator
    if (display === '0' && key !== '.' && !['+', '-', '*', '/'].includes(key)) {
      setDisplay(key);
    } else {
      // Prevent consecutive operators
      const lastChar = display.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar) && ['+', '-', '*', '/'].includes(key)) {
        setDisplay(display.slice(0, -1) + key);
      } else {
        setDisplay(display + key);
      }
    }
  };

  const calculateResult = () => {
    try {
      // Sanitize: allow numbers, operators (+, -, *, /, .), parentheses, spaces
      const sanitized = display.replace(/[^0-9+\-*/.() ]/g, '');
      if (!sanitized) return;
      
      // Evaluate using Function with no globals
      const fn = new Function(`return (${sanitized})`);
      const result = fn();

      if (typeof result === 'number' && Number.isFinite(result)) {
        const rounded = Math.round(result * 10000) / 10000;
        setHistory(`${display} =`);
        setDisplay(String(rounded));
        return rounded;
      } else {
        setDisplay('Error');
      }
    } catch {
      setDisplay('Error');
    }
    return null;
  };

  const handleApply = () => {
    let finalVal = null;
    // If expression contains operators, evaluate first
    if (/[+\-*/]/.test(display)) {
      finalVal = calculateResult();
    } else {
      finalVal = parseFloat(display);
    }

    const numericVal = Number.isFinite(finalVal) ? finalVal : parseFloat(display) || 0;
    onApply(numericVal);
    onClose();
  };

  const buttons = [
    ['C', 'DEL', '(', ')'],
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xs rounded-2xl p-4 shadow-2xl bg-white border border-slate-200">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
            <CalcIcon className="w-4 h-4 text-indigo-600" />
            Calculate {title}
          </DialogTitle>
        </DialogHeader>

        {/* Digital Display */}
        <div className="my-2 rounded-xl bg-slate-900 p-3 text-right text-white shadow-inner font-mono">
          <div className="h-4 text-[10px] text-slate-400 overflow-hidden">{history}</div>
          <div className="text-xl font-bold tracking-wider truncate">{display}</div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-1.5">
          {buttons.flat().map((btn, idx) => {
            const isOperator = ['+', '-', '*', '/', '='].includes(btn);
            const isAction = ['C', 'DEL', '(', ')'].includes(btn);
            const isEquals = btn === '=';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleKeyPress(btn)}
                className={`h-11 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center ${
                  isEquals
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                    : isOperator
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : isAction
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {btn === 'DEL' ? <Delete className="w-4 h-4" /> : btn}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1 h-9 rounded-xl text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="flex-1 h-9 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
