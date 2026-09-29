import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftIcon, rightIcon, className = '', id, ...props },
    ref
  ) => {
    const generatedId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        <label
          htmlFor={generatedId}
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {label}
        </label>
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={generatedId}
            ref={ref}
            className={`block w-full rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:bg-black/5 ${
              leftIcon ? 'pl-10' : 'pl-3'
            } ${rightIcon ? 'pr-10' : 'pr-3'} py-2.5 min-h-[44px] ${
              error ? 'border-red-500 focus:ring-red-500' : ''
            }`}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-separator)',
              color: 'var(--color-text-primary)',
              '--tw-ring-color': error ? 'rgb(239, 68, 68)' : 'var(--color-accent)',
            } as React.CSSProperties}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        {hint && !error && (
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
