import React from 'react';
import { useParams } from 'react-router-dom';
import InsightsHeader from '../modules/seo-insights/components/InsightsHeader';
import InsightsKPIs from '../modules/seo-insights/components/InsightsKPIs';
import InsightsFilters, {
  type InsightFilterValue,
} from '../modules/seo-insights/components/InsightsFilters';
import InsightsTable from '../modules/seo-insights/components/InsightsTable';
import InsightDetailDrawer from '../modules/seo-insights/components/InsightDetailDrawer';
import {
  getKpisFromInsights,
  mockInsights,
  type MockInsight,
} from '../modules/seo-insights/mocks/insightsMockData';

const ProjectInsightsPage: React.FC = () => {
  const { projectId = '' } = useParams();
  const [filters, setFilters] = React.useState<InsightFilterValue>({
    query: '',
    severity: 'all',
    status: 'all',
  });
  const [selectedInsight, setSelectedInsight] = React.useState<MockInsight | null>(null);

  const projectInsights = React.useMemo(() => {
    return mockInsights
      .filter((insight) => insight.projectId === projectId)
      .filter((insight) =>
        filters.query
          ? `${insight.keyword} ${insight.pageUrl}`.toLowerCase().includes(filters.query.toLowerCase())
          : true,
      )
      .filter((insight) => (filters.severity === 'all' ? true : insight.severity === filters.severity))
      .filter((insight) => (filters.status === 'all' ? true : insight.status === filters.status));
  }, [projectId, filters]);

  const kpis = getKpisFromInsights(projectInsights);

  return (
    <div className="space-y-4">
      <InsightsHeader
        title={`Project Insights · ${projectId || 'N/A'}`}
        subtitle="Visión por proyecto con detalle, recomendación y feedback histórico."
      />
      <InsightsKPIs
        total={kpis.total}
        open={kpis.open}
        inProgress={kpis.inProgress}
        resolved={kpis.resolved}
      />
      <InsightsFilters value={filters} onChange={setFilters} />
      <InsightsTable
        insights={projectInsights}
        selectedIds={[]}
        onToggleSelection={() => undefined}
        onOpenDetail={setSelectedInsight}
      />
      <InsightDetailDrawer insight={selectedInsight} onClose={() => setSelectedInsight(null)} />
    </div>
  );
};

export default ProjectInsightsPage;
