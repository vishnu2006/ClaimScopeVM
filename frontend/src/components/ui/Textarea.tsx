import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, rows = 3, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold uppercase tracking-wider text-surface-700"
          >
            {label}
            {props.required && <span className="text-status-error ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            'w-full rounded-md border bg-surface-0 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-400 resize-y',
            error
              ? 'border-status-error focus:ring-status-error focus:border-status-error text-status-error'
              : 'border-surface-300 hover:border-surface-400',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-status-error font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-surface-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
