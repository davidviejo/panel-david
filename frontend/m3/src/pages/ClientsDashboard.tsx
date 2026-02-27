import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalService, authService } from '../services/auth';

interface Client {
    id: string;
    name: string;
    domain: string;
    status: string;
}

const ClientsDashboard: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await portalService.getClients();
                setClients(data);
            } catch (err: any) {
                console.error(err);
                if (err.response?.status === 401) {
                    authService.logout();
                    navigate('/clientes');
                } else {
                    setError('Error al cargar los clientes.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, [navigate]);

    const handleProjectAccess = (slug: string) => {
        navigate(`/p/${slug}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Área de Clientes</h1>
                    <button
                        onClick={() => {
                            authService.logout();
                            navigate('/');
                        }}
                        className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                        Cerrar Sesión
                    </button>
                </header>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clients.map((client) => (
                            <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 p-6 flex flex-col justify-between h-48">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-semibold text-gray-800 truncate" title={client.name}>
                                            {client.name}
                                        </h3>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {client.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4 truncate">{client.domain}</p>
                                </div>
                                <button
                                    onClick={() => handleProjectAccess(client.id)}
                                    className="w-full bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded transition duration-200"
                                >
                                    Acceder al Proyecto
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientsDashboard;
