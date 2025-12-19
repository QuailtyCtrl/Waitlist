import { useState, useRef } from 'react';

interface CodeInputProps {
  onComplete: (code: string) => void;
  loading?: boolean;
  error?: string;
  onErrorChange?: (error: string) => void;
}

export function CodeInput({ onComplete, loading = false, error = '', onErrorChange }: CodeInputProps) {
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCodes = [...codes];
    newCodes[index] = value.slice(-1);
    setCodes(newCodes);
    onErrorChange?.('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCodes.every(c => c) && newCodes.join('').length === 6) {
      onComplete(newCodes.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCodes = text.split('').concat(['', '', '', '', '', '']).slice(0, 6) as string[];
    setCodes(newCodes);
    if (text.length === 6) {
      onComplete(text);
    }
  };

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {codes.map((code, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={code}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-10 h-12 text-center text-lg font-semibold border border-gray-300 rounded focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
          disabled={loading}
          placeholder="-"
        />
      ))}
    </div>
  );
}
