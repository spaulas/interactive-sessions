import type { FC, ReactNode } from 'react';
import React from 'react';

export const KawaiiButton: FC<{
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}> = ({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
  className = '',
}) => {
  const baseStyle =
    'px-6 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer';
  const variants = {
    primary:
      'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
    secondary:
      'bg-gradient-to-r from-blue-400 to-cyan-400 text-white hover:from-blue-500 hover:to-cyan-500',
    danger:
      'bg-gradient-to-r from-red-400 to-pink-400 text-white hover:from-red-500 hover:to-pink-500',
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
