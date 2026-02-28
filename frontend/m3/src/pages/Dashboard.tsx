import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from 'recharts';
import { ModuleData } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Download,
  Mic,
  Sparkles,
  Flame,
  LogIn,
  Settings,
  X,
  Search,
  Globe,
  MousePointerClick,
  Target,
  Split,
  EyeOff,
  BarChart2,
  Repeat,
  Calendar as CalendarIcon,
  ShieldCheck,
  Database,
  Zap,
} from 'lucide-react';
import { useToast } from '../components/ui/ToastContext';
import { Skeleton } from '../components/ui/Skeleton';
import { Spinner } from '../components/ui/Spinner';
import { useGSCAuth } from '../hooks/useGSCAuth';
import { useGSCData } from '../hooks/useGSCData';
import { GSCDateRangeControl } from '../components/GSCDateRangeControl';
import { InsightDetailModal } from '../components/InsightDetailModal';
import { InsightResult } from '../utils/gscInsights';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface DashboardProps {
  modules: ModuleData[];
  globalScore: number;
  onReset?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ modules, globalScore }) => {
  const navigate = useNavigate();
  const { success: showSuccess } = useToast();
  const [quickTask, setQuickTask] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<InsightResult | null>(null);

  // Date State for GSC
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 28);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Custom Hooks
  const {
    gscAccessToken,
    googleUser,
    clientId,
    showGscConfig,
    setShowGscConfig,
    handleSaveClientId,
    handleLogoutGsc,
    login,
    setClientId,
  } = useGSCAuth();

  const {
    gscSites,
    selectedSite,
    setSelectedSite,
    gscData,
    isLoadingGsc,
    insights: {
      quickWins,
      strikingDistance,
      lowCtr,
      topQueries,
      cannibalization,
      zeroClicks,
      featuredSnippets,
      stagnantTraffic,
      seasonality,
      stableUrls,
      internalRedirects,
    },
  } = useGSCData(gscAccessToken, startDate, endDate);

  // Determine Rank Badge
  let badge = { title: 'Becario SEO', color: 'bg-slate-100 text-slate-600' };
  if (globalScore >= 20) badge = { title: 'Analista Junior', color: 'bg-blue-100 text-blue-700' };
  if (globalScore >= 40) badge = { title: 'Estratega SEO', color: 'bg-indigo-100 text-indigo-700' };
  if (globalScore >= 60)
    badge = { title: 'Líder Técnico SEO', color: 'bg-purple-100 text-purple-700' };
  if (globalScore >= 80)
    badge = { title: 'Jefe de Audiencias', color: 'bg-amber-100 text-amber-700' };
  if (globalScore >= 95)
    badge = { title: 'Chief SEO Officer', color: 'bg-emerald-100 text-emerald-700' };

  // Calculate progress per module
  const chartData = modules.map((m) => {
    const total = m.tasks.length;
    const completed = m.tasks.filter((t) => t.status === 'completed').length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return {
      name: `M${m.id}`,
      fullTitle: m.title,
      score: percentage,
      color: percentage === 100 ? '#10b981' : percentage > 50 ? '#3b82f6' : '#94a3b8',
    };
  });

  // Calculate Radar Data
  const categoryScores: Record<string, { total: number; completed: number }> = {};
  modules.forEach((m) => {
    m.tasks.forEach((t) => {
      const cat = t.category || 'General';
      if (!categoryScores[cat]) {
        categoryScores[cat] = { total: 0, completed: 0 };
      }
      categoryScores[cat].total += 1;
      if (t.status === 'completed') {
        categoryScores[cat].completed += 1;
      }
    });
  });

  const radarData = Object.keys(categoryScores).map((cat) => ({
    subject: cat,
    A: Math.round((categoryScores[cat].completed / categoryScores[cat].total) * 100),
    fullMark: 100,
  }));

  const nextModule = modules.find((m) => {
    const total = m.tasks.length;
    const completed = m.tasks.filter((t) => t.status === 'completed').length;
    return completed < total;
  });

  // --------------------

  const handleExport = () => {
    const date = new Date().toLocaleDateString();
    const text = `REPORTE SEO MEDIAFLOW - ${date}\nPuntuación Global: ${globalScore}% (${badge.title})\n\n${modules.map((m) => `${m.title}: ${m.tasks.filter((t) => t.status === 'completed').length}/${m.tasks.length}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_MediaFlow_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    showSuccess('Reporte descargado.');
  };

  const simulateVoiceRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setQuickTask('Revisar etiquetas canonical en la sección de deportes...');
      setIsRecording(false);
      showSuccess('Nota de voz transcrita.');
    }, 1500);
  };

  const InsightCard = ({
    insight,
    icon: Icon,
    colorClass,
    gradient,
  }: {
    insight: InsightResult | null;
    icon: any;
    colorClass: string;
    gradient: string;
  }) => {
    if (!insight)
      return (
        <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-4 flex items-center justify-center text-slate-400 h-full min-h-[140px]">
          <div className="text-center">
            <Icon size={20} className="mx-auto mb-2 opacity-50" />
            <span className="text-xs font-medium">Sin datos</span>
          </div>
        </div>
      );

    return (
      <div
        onClick={() => setSelectedInsight(insight)}
        className={`group cursor-pointer rounded-2xl p-5 text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-full min-h-[140px] transition-transform hover:scale-[1.02] active:scale-95 ${gradient}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>

        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-2 mb-1 opacity-90">
            <Icon size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider leading-tight max-w-[120px]">
              {insight.title}
            </span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold">
            {insight.count}
          </div>
        </div>

        <div className="relative z-10 mt-2">
          <div className="text-3xl font-bold">{insight.count}</div>
          <div className="text-xs opacity-80 mt-1 line-clamp-2">{insight.description}</div>

          <div className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
            Ver detalles <ArrowRight size={12} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-900 dark:text-slate-100 relative">
      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <ErrorBoundary>
            <InsightDetailModal
              insight={selectedInsight}
              onClose={() => setSelectedInsight(null)}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* GSC Config Modal */}
      {showGscConfig && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings size={20} /> Configuración Global API
              </h3>
              <button onClick={() => setShowGscConfig(false)}>
                <X />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Introduce el <strong>Client ID</strong> de tu proyecto en Google Cloud. Esto permitirá
              que cualquier usuario de tu equipo se conecte con su propia cuenta de Gmail/Workspace
              para ver sus proyectos.
            </p>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              OAuth 2.0 Client ID
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg mb-4 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-mono text-sm"
              placeholder="xxxx-xxxx.apps.googleusercontent.com"
              defaultValue={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <button
              onClick={() => handleSaveClientId(clientId)}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Guardar Configuración Global
            </button>
            <p className="text-xs text-center text-slate-400 mt-3">
              Este ID se guarda en el navegador de este dispositivo.
            </p>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            Visión General de Madurez
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${badge.color} border border-black/5`}
            >
              {badge.title}
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Sigue la evolución SEO de tu publicación desde la auditoría hasta la autoridad.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!googleUser ? (
            <>
              <button
                onClick={() => setShowGscConfig(true)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => login()}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium shadow-sm"
              >
                <LogIn size={16} className="text-blue-500" />
                <span>Login con Google</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 pr-4 shadow-sm">
              <div className="relative">
                <img
                  src={googleUser.picture}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-slate-200"
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
                  {googleUser.name}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">{googleUser.email}</span>
              </div>
              <button onClick={handleLogoutGsc} className="ml-2 text-slate-400 hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Download size={16} /> Exportar
          </button>
        </div>
      </header>

      {/* Voice Input Row */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm h-16 w-full max-w-2xl">
        <button
          onClick={simulateVoiceRecording}
          className={`p-3 rounded-lg transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
        >
          <Mic size={20} />
        </button>
        <input
          type="text"
          value={quickTask}
          onChange={(e) => setQuickTask(e.target.value)}
          placeholder={isRecording ? 'Escuchando...' : 'Nota rápida...'}
          className="flex-1 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm"
        />
      </div>

      {/* GSC Insight Grid (The 8 Modules) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Fruta Madura (Quick Wins) */}
        <InsightCard
          insight={quickWins}
          icon={Zap}
          colorClass="text-yellow-100"
          gradient="bg-gradient-to-br from-yellow-500 to-amber-600"
        />

        {/* 2. Keywords Potenciales */}
        <InsightCard
          insight={strikingDistance}
          icon={Target}
          colorClass="text-emerald-100"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />

        {/* 3. CTR Bajo */}
        <InsightCard
          insight={lowCtr}
          icon={MousePointerClick}
          colorClass="text-rose-100"
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
        />

        {/* 4. Canibalización */}
        <InsightCard
          insight={cannibalization}
          icon={Split}
          colorClass="text-indigo-100"
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
        />

        {/* 5. Tráfico Estancado */}
        <InsightCard
          insight={stagnantTraffic}
          icon={BarChart2}
          colorClass="text-amber-100"
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />

        {/* 6. Redirecciones Internas (Proxy) */}
        <InsightCard
          insight={internalRedirects}
          icon={Repeat}
          colorClass="text-red-100"
          gradient="bg-gradient-to-br from-red-500 to-red-700"
        />

        {/* 7. Fragmentos Destacados */}
        <InsightCard
          insight={featuredSnippets}
          icon={Sparkles}
          colorClass="text-purple-100"
          gradient="bg-gradient-to-br from-purple-500 to-fuchsia-600"
        />

        {/* 8. Alertas Estacionales */}
        <InsightCard
          insight={seasonality}
          icon={CalendarIcon}
          colorClass="text-cyan-100"
          gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* GSC Real Data Chart */}
          {gscAccessToken ? (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                <Search size={200} />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                      Rendimiento en Búsqueda
                    </h3>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Datos reales de Search Console
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GSCDateRangeControl
                    startDate={startDate}
                    endDate={endDate}
                    onRangeChange={(start, end) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                  />
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Globe size={14} className="ml-2 text-slate-400" />
                    <select
                      className="bg-transparent text-xs font-medium p-1.5 outline-none text-slate-700 dark:text-slate-300 max-w-[180px]"
                      value={selectedSite}
                      onChange={(e) => setSelectedSite(e.target.value)}
                    >
                      {gscSites.map((site) => (
                        <option key={site.siteUrl} value={site.siteUrl}>
                          {site.siteUrl.replace('sc-domain:', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                {isLoadingGsc ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                    <Spinner size={32} />
                    <Skeleton width="60%" height="20px" />
                    <span className="text-sm">Sincronizando datos de Google...</span>
                  </div>
                ) : gscData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={gscData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                        opacity={0.5}
                      />
                      <XAxis dataKey="keys[0]" hide axisLine={false} tickLine={false} />
                      <YAxis
                        orientation="right"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          fontFamily: 'Inter, sans-serif',
                        }}
                        labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorClicks)"
                        name="Clics"
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="impressions"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        fillOpacity={0}
                        strokeDasharray="5 5"
                        name="Impresiones"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Search size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">Sin datos disponibles para este periodo.</p>
                    <p className="text-xs opacity-70">
                      Prueba cambiando de propiedad o verifica tu Search Console.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Fallback Metrics if NOT connected */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <CheckCircle2 size={24} />
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    Tareas Completadas
                  </p>
                  <h3 className="text-3xl font-bold mt-1">
                    {modules.reduce(
                      (acc, m) => acc + m.tasks.filter((t) => t.status === 'completed').length,
                      0,
                    )}
                    <span className="text-slate-300 dark:text-slate-600 text-lg ml-2 font-normal">
                      / {modules.reduce((acc, m) => acc + m.tasks.length, 0)}
                    </span>
                  </h3>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-4">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${globalScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={24} />
                    </div>
                    <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-bold px-2 py-1 rounded-full">
                      Acción Requerida
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    Próxima Prioridad
                  </p>
                  <h3 className="text-xl font-bold mt-1 line-clamp-2">
                    {nextModule ? nextModule.title : 'Todo Limpio'}
                  </h3>
                </div>
                {nextModule && (
                  <button
                    onClick={() => navigate(`/app/module/${nextModule.id}`)}
                    className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
                  >
                    Ir al Módulo <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Progress Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold">Madurez por Módulo</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#334155"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          {/* Real GSC Top Queries */}
          {topQueries && topQueries.items.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Flame className="text-orange-500" size={20} /> Top Consultas
                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">
                  GSC Data
                </span>
              </h3>
              <div className="space-y-3">
                {topQueries.items.slice(0, 5).map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="text-sm font-semibold group-hover:text-blue-500 line-clamp-1">
                        {t.keys[0]}
                      </div>
                      <div className="text-xs text-slate-400">
                        Posición: {t.position.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t.clicks.toLocaleString()} clics
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 opacity-60">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Flame className="text-slate-400" size={20} /> Top Consultas
              </h3>
              <div className="text-sm text-slate-400 text-center py-4">
                Sin datos de consultas recientes.
              </div>
            </div>
          )}

          {/* Radar Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#64748b" opacity={0.3} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Madurez"
                    dataKey="A"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => {
          const completedCount = m.tasks.filter((t) => t.status === 'completed').length;
          const totalCount = m.tasks.length;
          const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <div
              key={m.id}
              onClick={() => navigate(`/app/module/${m.id}`)}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Nivel {m.levelRange}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${progress === 100 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}
                >
                  M{m.id}
                </div>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {m.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 h-10">
                {m.description}
              </p>

              <div className="mt-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {Math.round(progress)}% Completado
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    {completedCount}/{totalCount}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
