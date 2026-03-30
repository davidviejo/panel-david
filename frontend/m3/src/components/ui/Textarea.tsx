import React from 'react';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-brand-md border border-border bg-surface-alt px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted focus:ring-4 focus:ring-primary/20 ${className}`}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';
