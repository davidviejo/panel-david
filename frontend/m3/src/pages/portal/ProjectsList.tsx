import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { LayoutGrid, ExternalLink, Activity, ArrowRight, LogOut } from 'lucide-react';

interface Client {
  slug: string;
  name: string;
  status: string;
  description: string;
}

const ProjectsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await api.getClients();
        setClients(data);
      } catch (err) {
        // If error (likely 401), redirect to login
        navigate('/clientes');
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Cargando proyectos...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
           <span className="font-bold text-lg text-slate-900">Portal de Clientes</span>
        </div>
        <button
            onClick={() => api.logout()}
            className="text-slate-500 hover:text-red-600 flex items-center text-sm font-medium transition-colors"
        >
            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Proyectos Activos</h1>
                <p className="text-slate-500">Selecciona un proyecto para acceder a su dashboard detallado.</p>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Sistema Operativo</span>
            </div>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <LayoutGrid className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-900 mb-2">No hay proyectos asignados</h3>
            <p className="text-slate-500">Contacta con administración si crees que esto es un error.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div key={client.slug} className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all flex flex-col justify-between h-64 cursor-pointer" onClick={() => navigate(`/p/${client.slug}`)}>
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {client.status === 'active' ? 'Activo' : 'Pausado'}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{client.name}</h3>
                    <p className="text-slate-500 text-sm line-clamp-3">{client.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-auto">
                    <span className="text-xs text-slate-400 font-mono">ID: {client.slug}</span>
                    <span className="text-blue-600 text-sm font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                        Acceder <ArrowRight className="ml-1 w-4 h-4" />
                    </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;
