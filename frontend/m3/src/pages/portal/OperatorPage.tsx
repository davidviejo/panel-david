import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Terminal, Play } from 'lucide-react';

const OperatorPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.authOperator(password);
      if (res.token) {
        setIsAuthenticated(true);
      } else {
        setError('Acceso denegado');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const runTool = async (toolName: string) => {
      try {
          const res = await api.runOperatorTool(toolName);
          setOutput(prev => [...prev, `> Run ${toolName}: ${res.status} - ${res.message}`]);
      } catch (err) {
          setOutput(prev => [...prev, `> Error running ${toolName}`]);
      }
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-mono">
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                <h1 className="text-2xl font-bold text-green-400 flex items-center">
                    <Terminal className="mr-2" /> Operator Console
                </h1>
                <button onClick={() => {
                    api.logout();
                    navigate('/');
                }} className="text-sm text-slate-400 hover:text-white">Logout</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase">Available Tools</h2>
                    {['audit_crawl', 'gsc_sync', 'keyword_gap', 'backlink_check'].map(tool => (
                        <button
                            key={tool}
                            onClick={() => runTool(tool)}
                            className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex justify-between items-center transition-colors"
                        >
                            <span>{tool}</span>
                            <Play className="w-4 h-4 text-green-500" />
                        </button>
                    ))}
                </div>
                <div className="md:col-span-2">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase mb-4">Console Output</h2>
                    <div className="bg-black/50 p-4 rounded-lg border border-slate-700 h-96 overflow-y-auto font-mono text-sm">
                        {output.length === 0 ? <span className="text-slate-600">Waiting for commands...</span> : output.map((line, i) => (
                            <div key={i} className="mb-1 border-b border-white/5 pb-1">{line}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Operator Access</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Security Clearance</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/20 text-red-400 px-4 py-3 rounded-lg text-sm border border-red-900/50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Initialize'}
          </button>
        </form>
         <div className="mt-6 text-center">
          <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-400">
            Abort
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperatorPage;
