import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

const OperatorLogin: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authService.loginOperator(password);
            // Where should operator go? Maybe to clients list but with more powers?
            // For now, let's go to clients dashboard as they can see everything.
            navigate('/clientes/dashboard');
        } catch (err: any) {
            setError('Acceso no autorizado');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded shadow-lg w-full max-w-md border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-center text-white">Modo Operador</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
                            Clave Maestra
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
                    >
                        {loading ? 'Accediendo...' : 'Iniciar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OperatorLogin;
