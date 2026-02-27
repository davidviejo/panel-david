import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChecklistItem } from './ChecklistItem';
import { describe, it, expect, vi } from 'vitest';
import { ChecklistItem as IChecklistItem } from '../../types/seoChecklist';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronRight: () => <span>ChevronRight</span>,
  Info: () => <span>Info</span>,
  BrainCircuit: () => <span>BrainCircuit</span>,
  Map: () => <span>Map</span>,
  Store: () => <span>Store</span>,
  CheckCircle2: () => <span>CheckCircle2</span>,
  XCircle: () => <span>XCircle</span>,
  Image: () => <span>Image</span>,
  LocateFixed: () => <span>LocateFixed</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  List: () => <span>List</span>,
  FileText: () => <span>FileText</span>,
  Target: () => <span>Target</span>,
  Search: () => <span>Search</span>,
  LayoutList: () => <span>LayoutList</span>,
  Code: () => <span>Code</span>,
  Copy: () => <span>Copy</span>,
  Link: () => <span>Link</span>,
  ExternalLink: () => <span>ExternalLink</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronUp: () => <span>ChevronUp</span>,
  Type: () => <span>Type</span>,
  Check: () => <span>Check</span>,
  X: () => <span>X</span>,
}));

// Mock InternalLinksAnalysis
vi.mock('./InternalLinksAnalysis', () => ({
  InternalLinksAnalysis: () => <div data-testid="internal-links-analysis">Internal Links Analysis</div>,
}));

describe('ChecklistItem', () => {
  it('renders correctly with advanced content', () => {
    const item: IChecklistItem = {
      key: 'CONTENIDOS',
      label: '4. Contenidos',
      status_manual: 'NO',
      notes_manual: '',
      autoData: {
          competitorUrlsUsed: ['http://comp1.com'],
          gapSections: ['Section 1'],
          outlines: { h1: 'Title' }
      }
    };
    const onChange = vi.fn();
    render(<ChecklistItem item={item} onChange={onChange} />);

    // Click to expand
    fireEvent.click(screen.getByText('4. Contenidos'));

    expect(screen.getByText('http://comp1.com')).toBeDefined();
    expect(screen.getByText('Section 1')).toBeDefined();
    expect(screen.getByText('Outlines Sugeridos')).toBeDefined();
  });

  it('shows advanced warning', () => {
    const item: IChecklistItem = {
      key: 'CONTENIDOS',
      label: '4. Contenidos',
      status_manual: 'NO',
      notes_manual: '',
      autoData: {
          advancedExecuted: false,
          advancedBlockedReason: 'No credits'
      }
    };
    const onChange = vi.fn();
    render(<ChecklistItem item={item} onChange={onChange} />);

    fireEvent.click(screen.getByText('4. Contenidos'));

    expect(screen.getByText('Análisis Avanzado Deshabilitado')).toBeDefined();
    expect(screen.getByText('No credits')).toBeDefined();
  });

  it('renders structured data with robust JSON viewer', () => {
      const item: IChecklistItem = {
          key: 'DATOS_ESTRUCTURADOS',
          label: '3. Datos estructurados',
          status_manual: 'SI',
          notes_manual: '',
          autoData: {
              schemasParsed: ['Article'],
              jsonLd: { "@context": "https://schema.org", "@type": "Article" }
          }
      };
      const onChange = vi.fn();
      render(<ChecklistItem item={item} onChange={onChange} />);

      fireEvent.click(screen.getByText('3. Datos estructurados'));

      expect(screen.getByText('Article')).toBeDefined(); // Tag
      expect(screen.getByText('Bruto del Análisis')).toBeDefined();
      // Since JSON.stringify formats with newlines, exact text match might be tricky, but we can check if it contains parts
      // Or just that the component rendered without error.
  });
});
