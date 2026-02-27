import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Key } from 'lucide-react';

const ProjectLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.authProject(slug, password);
      if (res.token) {
        navigate(`/c/${slug}/overview`);
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
            <Key className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Acceso a Proyecto</h1>
          <p className="text-slate-500 mt-2">Proyecto: <span className="font-semibold text-slate-700">{slug}</span></p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Clave del Proyecto</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
          >
            {loading ? 'Desbloquear' : 'Entrar'}
          </button>
        </form>
         <div className="mt-6 text-center">
          <button onClick={() => navigate('/clientes')} className="text-sm text-slate-400 hover:text-slate-600">
            ← Volver a lista de clientes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectLogin;
