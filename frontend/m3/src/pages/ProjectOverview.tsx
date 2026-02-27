import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { portalService, authService } from '../services/auth';

interface ProjectOverviewData {
    project: {
        id: string;
        name: string;
        domain: string;
    };
    stats: {
        organic_traffic: number;
        keywords_top_3: number;
        keywords_top_10: number;
        health_score: number;
    };
    recent_activities: {
        date: string;
        action: string;
    }[];
}

const ProjectOverview: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [data, setData] = useState<ProjectOverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOverview = async () => {
            if (!slug) return;
            try {
                const result = await portalService.getProjectOverview(slug);
                setData(result);
            } catch (err: any) {
                console.error(err);
                if (err.response?.status === 403 || err.response?.status === 401) {
                    setError('Acceso denegado. Por favor inicia sesión nuevamente.');
                    authService.logout();
                    navigate(`/p/${slug}`);
                } else {
                    setError('Error al cargar datos del proyecto.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, [slug, navigate]);

    if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="text-red-500 text-center p-10">{error}</div>;
    if (!data) return <div className="text-center p-10">No se encontraron datos.</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{data.project.name}</h1>
                    <p className="text-gray-500">{data.project.domain}</p>
                </div>
                <button
                    onClick={() => {
                        authService.logout();
                        navigate('/');
                    }}
                    className="text-gray-600 hover:text-red-600 font-medium transition"
                >
                    Salir
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium">Tráfico Orgánico</p>
                    <p className="text-3xl font-bold text-blue-600">{data.stats.organic_traffic.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium">KW Top 3</p>
                    <p className="text-3xl font-bold text-green-600">{data.stats.keywords_top_3}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium">KW Top 10</p>
                    <p className="text-3xl font-bold text-purple-600">{data.stats.keywords_top_10}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium">Health Score</p>
                    <div className="flex items-center">
                        <span className="text-3xl font-bold text-orange-600">{data.stats.health_score}</span>
                        <span className="ml-1 text-gray-400">/ 100</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Actividad Reciente</h3>
                <ul className="divide-y divide-gray-100">
                    {data.recent_activities.map((activity, index) => (
                        <li key={index} className="py-3 flex justify-between items-center">
                            <span className="text-gray-700">{activity.action}</span>
                            <span className="text-gray-400 text-sm">{activity.date}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ProjectOverview;
