import React from 'react';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', ...props }, ref) => (
    <select
      ref={ref}
      className={`w-full rounded-brand-md border border-border bg-surface-alt px-4 py-2 text-sm text-foreground outline-none transition-all focus:ring-4 focus:ring-primary/20 ${className}`}
      {...props}
    />
  ),
);

Select.displayName = 'Select';
