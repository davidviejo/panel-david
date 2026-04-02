import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Activity, AlertTriangle, CheckCircle, LogOut, ArrowLeft } from 'lucide-react';
import { PortalShell } from '../../components/shell/ShellVariants';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { api } from '../../services/api';
import { featureFlags } from '../../config/featureFlags';
import { ProjectOverviewViewModel } from '../../shared/api/contracts/projectOverview';
import { getUiApiErrorDisplay, normalizeApiError } from '../../shared/api/errorHandling';
import { logApiError } from '../../shared/api/apiErrorLogger';
import { mapProjectOverviewToViewModel } from '../../shared/api/mappers/projectOverviewMapper';

const LEGACY_FALLBACK_OVERVIEW: ProjectOverviewViewModel = {
  projectSlug: 'legacy-overview',
  generatedAt: '',
  urlsTracked: 0,
  urlsOk: 0,
  healthScore: 0,
  issuesOpen: 0,
  recentIssues: [],
};

const ProjectOverview: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ProjectOverviewViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [traceabilityId, setTraceabilityId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      try {
        if (!featureFlags.portalOverviewBackendSource) {
          setData({ ...LEGACY_FALLBACK_OVERVIEW, projectSlug: slug });
          return;
        }

        const response = await api.getProjectOverview(slug);
        setData(mapProjectOverviewToViewModel(response));
      } catch (error) {
        const display = getUiApiErrorDisplay(error, 'No pudimos cargar el overview del proyecto.');
        setErrorMessage(display.message);
        setTraceabilityId(display.traceabilityId);
        const normalized = normalizeApiError(error, display.message);
        logApiError({
          endpoint: `/api/${slug}/overview`,
          code: normalized.code,
          message: normalized.message,
          status: normalized.status,
          traceId: normalized.traceId,
          requestId: normalized.requestId,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, navigate]);

  if (loading)
    return (
      <PortalShell contentClassName="flex min-h-screen items-center justify-center px-4">
        <EmptyState title="Cargando dashboard..." icon={<Spinner size={28} />} />
      </PortalShell>
    );

  if (errorMessage) {
    return (
      <PortalShell contentClassName="flex min-h-screen items-center justify-center px-4">
        <EmptyState
          title={errorMessage}
          description={traceabilityId ? `ID de trazabilidad: ${traceabilityId}` : undefined}
        />
      </PortalShell>
    );
  }

  if (!data || data.urlsTracked === 0) {
    return (
      <PortalShell contentClassName="flex min-h-screen items-center justify-center px-4">
        <EmptyState
          title="Aún no hay datos de overview para este proyecto."
          description="Ejecuta un crawl para comenzar a ver métricas."
        />
      </PortalShell>
    );
  }

  return (
    <PortalShell
      header={
        <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/clientes/dashboard')}
                variant="ghost"
                className="text-slate-500"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold leading-none text-slate-900">{data.projectSlug}</h1>
                <span className="font-mono text-xs text-slate-500">Overview Dashboard</span>
              </div>
            </div>
            <Button onClick={() => void api.logout('/clientes')} variant="ghost" className="text-slate-500">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </nav>
      }
      contentClassName="w-full py-8 text-slate-800"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="flex items-center justify-between p-6">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">URLs Monitorizadas</p>
              <p className="text-3xl font-bold text-slate-900">{data.urlsTracked}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <BarChart className="h-6 w-6" />
            </div>
          </Card>

          <Card className="flex items-center justify-between p-6">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">URLs OK (200)</p>
              <p className="text-3xl font-bold text-slate-900">{data.urlsOk}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <Activity className="h-6 w-6" />
            </div>
          </Card>

          <Card className="flex items-center justify-between p-6">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">Health Score</p>
              <p className={`text-3xl font-bold ${data.healthScore > 80 ? 'text-green-600' : 'text-orange-500'}`}>
                {data.healthScore}/100
              </p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${data.healthScore > 80 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}
            >
              <CheckCircle className="h-6 w-6" />
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center border-b border-slate-100 px-6 py-5">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
            <h3 className="font-bold text-slate-900">Problemas Recientes Detectados</h3>
          </div>
          <div className="p-0">
            {data.recentIssues.map((issue) => (
              <div
                key={issue.message}
                className="flex items-center border-b border-slate-50 px-6 py-4 transition-colors last:border-0 hover:bg-slate-50"
              >
                <span className="mr-3 h-2 w-2 rounded-full bg-red-400"></span>
                <span className="text-sm font-medium text-slate-700">
                  {issue.message} ({issue.count})
                </span>
              </div>
            ))}
            {data.recentIssues.length === 0 && (
              <div className="p-6">
                <EmptyState title="Todo parece estar en orden." />
              </div>
            )}
          </div>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">Última actualización: {new Date(data.generatedAt).toLocaleString()}</p>
        </div>
      </div>
    </PortalShell>
  );
};

export default ProjectOverview;
