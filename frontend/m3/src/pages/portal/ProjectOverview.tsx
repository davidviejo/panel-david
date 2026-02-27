import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { BarChart, Activity, AlertTriangle, CheckCircle, LogOut, ArrowLeft } from 'lucide-react';

interface ProjectData {
  project: string;
  traffic: string;
  keywords_top3: number;
  health_score: number;
  recent_issues: string[];
}

const ProjectOverview: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      try {
        const res = await api.getProjectOverview(slug);
        setData(res);
      } catch (err) {
        navigate(`/p/${slug}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Cargando dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
         <div className="flex items-center space-x-4">
             <button onClick={() => navigate('/clientes/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                 <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
                 <h1 className="text-lg font-bold text-slate-900 leading-none">{data?.project}</h1>
                 <span className="text-xs text-slate-500 font-mono">Overview Dashboard</span>
             </div>
         </div>
         <button
            onClick={() => api.logout()}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title="Cerrar sesión"
        >
            <LogOut className="w-5 h-5" />
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Tráfico Orgánico (Est.)</p>
                    <p className="text-3xl font-bold text-slate-900">{data?.traffic}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <BarChart className="w-6 h-6" />
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                 <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Top 3 Keywords</p>
                    <p className="text-3xl font-bold text-slate-900">{data?.keywords_top3}</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                    <Activity className="w-6 h-6" />
                </div>
            </div>

             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                 <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Health Score</p>
                    <p className={`text-3xl font-bold ${data?.health_score && data.health_score > 80 ? 'text-green-600' : 'text-orange-500'}`}>
                        {data?.health_score}/100
                    </p>
                </div>
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center ${data?.health_score && data.health_score > 80 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    <CheckCircle className="w-6 h-6" />
                </div>
            </div>
        </div>

        {/* Issues List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                <h3 className="font-bold text-slate-900">Problemas Recientes Detectados</h3>
            </div>
            <div className="p-0">
                {data?.recent_issues.map((issue, idx) => (
                    <div key={idx} className="px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors flex items-center">
                        <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                        <span className="text-slate-700 text-sm font-medium">{issue}</span>
                    </div>
                ))}
                {(!data?.recent_issues || data.recent_issues.length === 0) && (
                    <div className="p-8 text-center text-slate-400">Todo parece estar en orden.</div>
                )}
            </div>
        </div>

        <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">Datos actualizados en tiempo real desde el crawler.</p>
        </div>

      </div>
    </div>
  );
};

export default ProjectOverview;
