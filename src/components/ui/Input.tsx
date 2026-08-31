import * as React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md bg-surface-900 border border-surface-700 px-3.5 py-2 text-sm text-surface-50 placeholder:text-surface-500 transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-accent-rose focus-visible:ring-accent-rose',
            className
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextInputProps extends InputProps {
  label?: string;
  helperText?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, helperText, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-surface-300">
            {label}
          </label>
        )}
        <Input id={inputId} ref={ref} error={error} {...props} />
        {error ? (
          <p className="text-xs text-accent-rose font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-surface-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
TextInput.displayName = 'TextInput';
