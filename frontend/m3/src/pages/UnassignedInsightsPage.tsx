import React from 'react';
import InsightsHeader from '../modules/seo-insights/components/InsightsHeader';
import InsightsKPIs from '../modules/seo-insights/components/InsightsKPIs';
import InsightsFilters, {
  type InsightFilterValue,
} from '../modules/seo-insights/components/InsightsFilters';
import InsightsTable from '../modules/seo-insights/components/InsightsTable';
import InsightDetailDrawer from '../modules/seo-insights/components/InsightDetailDrawer';
import AssignmentModal from '../modules/seo-insights/components/AssignmentModal';
import BulkAssignmentBar from '../modules/seo-insights/components/BulkAssignmentBar';
import {
  getKpisFromInsights,
  mockAssignees,
  mockInsights,
  type MockInsight,
} from '../modules/seo-insights/mocks/insightsMockData';

const defaultFilters: InsightFilterValue = { query: '', severity: 'all', status: 'all' };

const UnassignedInsightsPage: React.FC = () => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectedInsight, setSelectedInsight] = React.useState<MockInsight | null>(null);
  const [isAssignmentOpen, setIsAssignmentOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<InsightFilterValue>(defaultFilters);

  const unassigned = React.useMemo(() => {
    return mockInsights
      .filter((insight) => !insight.assigneeId)
      .filter((insight) =>
        filters.query
          ? `${insight.keyword} ${insight.pageUrl}`.toLowerCase().includes(filters.query.toLowerCase())
          : true,
      )
      .filter((insight) => (filters.severity === 'all' ? true : insight.severity === filters.severity))
      .filter((insight) => (filters.status === 'all' ? true : insight.status === filters.status));
  }, [filters]);

  const kpis = getKpisFromInsights(unassigned);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const assignSelected = (assigneeId: string) => {
    const assignee = mockAssignees.find((item) => item.id === assigneeId);
    if (!assignee) {
      return;
    }

    setSelectedInsight((prev) =>
      prev ? { ...prev, assigneeId: assignee.id, assigneeName: assignee.name } : prev,
    );
    setSelectedIds([]);
    setIsAssignmentOpen(false);
  };

  return (
    <div className="space-y-4">
      <InsightsHeader
        title="Unassigned Insights"
        subtitle="Vista operativa para asignar insights pendientes sin dependencia de integraciones reales."
      />
      <InsightsKPIs
        total={kpis.total}
        open={kpis.open}
        inProgress={kpis.inProgress}
        resolved={kpis.resolved}
      />
      <InsightsFilters value={filters} onChange={setFilters} />
      <InsightsTable
        insights={unassigned}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onOpenDetail={setSelectedInsight}
      />
      <BulkAssignmentBar
        selectedCount={selectedIds.length}
        onAssign={() => setIsAssignmentOpen(true)}
        onClear={() => setSelectedIds([])}
      />
      <InsightDetailDrawer insight={selectedInsight} onClose={() => setSelectedInsight(null)} />
      <AssignmentModal
        open={isAssignmentOpen}
        options={mockAssignees}
        onClose={() => setIsAssignmentOpen(false)}
        onAssign={assignSelected}
      />
    </div>
  );
};

export default UnassignedInsightsPage;
