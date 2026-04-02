import React from 'react';

interface InsightsHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

const InsightsHeader: React.FC<InsightsHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <header className="flex flex-col gap-3 rounded-brand-lg border border-border bg-surface p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
};

export default InsightsHeader;
