import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { BarChart, Activity, AlertTriangle, CheckCircle, LogOut, ArrowLeft } from 'lucide-react';
import { PortalShell } from '../../components/shell/ShellVariants';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { mapProjectOverviewToViewModel, ProjectOverviewViewModel } from '../../shared/api/mappers/projectOverviewMapper';
import { getUiApiErrorDisplay } from '../../shared/api/errorHandling';
import { featureFlags } from '../../config/featureFlags';

const buildFallbackModel = (slug: string): ProjectOverviewViewModel => ({
  projectName: slug,
  projectSlug: slug,
  trafficLabel: 'N/D',
  keywordsTop3: 0,
  healthScore: 0,
  healthScaleMax: 100,
  issues: [],
  isEmpty: true,
});

const ProjectOverview: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ProjectOverviewViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setErrorMessage('No encontramos el proyecto solicitado.');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await api.getProjectOverview(slug);
        setData(mapProjectOverviewToViewModel(response));
      } catch (error) {
        const normalized = getUiApiErrorDisplay(error, 'No fue posible cargar el overview del proyecto.');
        setErrorMessage(normalized.fullMessage);

        console.error('[portal-overview-error]', {
          endpoint: `/api/${slug}/overview`,
          status: (error as { status?: number })?.status,
          traceId: (error as { traceId?: string; requestId?: string })?.traceId ||
            (error as { requestId?: string })?.requestId,
        });

        if (featureFlags.portalOverviewFallback) {
          setData(buildFallbackModel(slug));
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading)
    return (
      <PortalShell contentClassName="flex min-h-screen items-center justify-center px-4">
        <EmptyState title="Cargando dashboard..." icon={<Spinner size={28} />} />
      </PortalShell>
    );

  if (errorMessage && !data) {
    return (
      <PortalShell contentClassName="flex min-h-screen items-center justify-center px-4">
        <EmptyState
          title="No pudimos cargar el overview"
          description={errorMessage}
          action={
            <Button onClick={() => navigate(`/p/${slug || ''}`)}>
              Volver al acceso de proyecto
            </Button>
          }
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
              <Button onClick={() => navigate('/clientes/dashboard')} variant="ghost" className="text-slate-500">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold leading-none text-slate-900">{data?.projectName}</h1>
                <span className="font-mono text-xs text-slate-500">Overview Dashboard</span>
              </div>
            </div>
            <Button onClick={() => api.logout()} variant="ghost" className="text-slate-500">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </nav>
      }
      contentClassName="w-full py-8 text-slate-800"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {errorMessage && data && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="flex items-center justify-between p-6">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">Tráfico Orgánico (Est.)</p>
              <p className="text-3xl font-bold text-slate-900">{data?.trafficLabel}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <BarChart className="h-6 w-6" />
            </div>
          </Card>

          <Card className="flex items-center justify-between p-6">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">Top 3 Keywords</p>
              <p className="text-3xl font-bold text-slate-900">{data?.keywordsTop3}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <Activity className="h-6 w-6" />
            </div>
          </Card>

          <Card className="flex items-center justify-between p-6">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500">Health Score</p>
              <p
                className={`text-3xl font-bold ${data?.healthScore && data.healthScore > 80 ? 'text-green-600' : 'text-orange-500'}`}
              >
                {data?.healthScore}/{data?.healthScaleMax ?? 100}
              </p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${data?.healthScore && data.healthScore > 80 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}
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
            {data?.issues.map((issue, idx) => (
              <div
                key={`${issue}-${idx}`}
                className="flex items-center border-b border-slate-50 px-6 py-4 transition-colors last:border-0 hover:bg-slate-50"
              >
                <span className="mr-3 h-2 w-2 rounded-full bg-red-400"></span>
                <span className="text-sm font-medium text-slate-700">{issue}</span>
              </div>
            ))}
            {(!data?.issues || data.issues.length === 0) && (
              <div className="p-6">
                <EmptyState title="No hay incidencias para mostrar." />
              </div>
            )}
          </div>
        </Card>
      </div>
    </PortalShell>
  );
};

export default ProjectOverview;
