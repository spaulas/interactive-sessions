import { useRef, useEffect } from 'react';
import type { FC, KeyboardEvent } from 'react';
import React from 'react';

export const KawaiiInput: FC<{
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: KeyboardEvent) => void;
  type?: string;
  autoFocus?: boolean;
}> = ({
  placeholder,
  value,
  onChange,
  onKeyPress,
  type = 'text',
  autoFocus,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <input
      ref={inputRef}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyPress={onKeyPress}
      className='w-full px-4 py-3 rounded-full border-2 border-purple-300 focus:border-purple-500 focus:outline-none transition-all duration-300 bg-white shadow-md'
    />
  );
};
