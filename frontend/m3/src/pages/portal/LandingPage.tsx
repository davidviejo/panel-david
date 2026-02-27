import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Linkedin, Twitter, Globe, CheckCircle, FolderOpen } from 'lucide-react';
import { api } from '../../services/api';
import { Spinner } from '../../components/ui/Spinner';
import { useProject } from '../../context/ProjectContext';

interface DisplayClient {
  slug: string;
  name: string;
  status: string;
  description: string;
  isLocal?: boolean;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { clients: localProjects, switchClient } = useProject();
  const [publicProjects, setPublicProjects] = useState<DisplayClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await api.getPublicClients();
        setPublicProjects(data);
      } catch (err) {
        console.error('Error fetching public clients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Map local projects to DisplayClient format
  const mappedLocalProjects: DisplayClient[] = localProjects.map((p) => ({
    slug: p.id,
    name: p.name,
    status: 'active',
    description: `Proyecto Local (${p.vertical}) - Creado el ${new Date(p.createdAt).toLocaleDateString()}`,
    isLocal: true,
  }));

  const combinedClients = [...mappedLocalProjects, ...publicProjects];

  const handleAccess = (client: DisplayClient) => {
    if (client.isLocal) {
      switchClient(client.slug);
      navigate('/app/');
    } else {
      navigate(`/p/${client.slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-orange-500 selection:text-white">
      {/* Navbar */}
      <nav className="fixed w-full bg-white z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo area */}
            <div className="flex items-center space-x-2">
               <div className="w-4 h-4 bg-orange-500 rotate-45 transform"></div>
               <span className="font-bold text-xl text-slate-900 tracking-tight">agenciaSEO.eu</span>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-8 text-sm font-semibold text-slate-500 uppercase tracking-wide">
              <a href="#experience" className="hover:text-orange-500 transition-colors">Experiencia</a>
              <a href="#projects" className="hover:text-orange-500 transition-colors">Proyectos</a>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-green-500">Disponible</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start gap-12">

          {/* Avatar */}
          <div className="flex-shrink-0">
             <div className="w-48 h-48 md:w-64 md:h-64 rounded-full p-2 border-4 border-orange-100 shadow-lg relative overflow-hidden bg-white">
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-4xl text-slate-400 font-bold overflow-hidden">
                   {/* Placeholder for real image */}
                   <span className="uppercase">DV</span>
                </div>
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6 pt-4">
            <div>
                 <h1 className="text-4xl md:text-5xl font-bold text-blue-900 tracking-tight leading-tight">
                  David Viejo
                </h1>
                <p className="text-lg text-orange-500 font-medium mt-1">
                  Consultor SEO — agenciaSEO.eu
                </p>
            </div>

            <p className="text-slate-600 leading-relaxed max-w-2xl text-base">
              Consultor SEO especializado con más de 10 años de experiencia en posicionamiento web,
              arquitectura de sitios y estrategia digital. Actualmente en agenciaSEO.eu, una de las
              agencias de referencia en SEO a nivel nacional. Especializado en e-commerce, portales
              de viajes y marketplaces de alto tráfico.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {['SEO Técnico', 'Arquitectura Web', 'SEM', 'Web Analytics', 'E-commerce', 'Link Building', 'Content Strategy'].map((skill) => (
                <span key={skill} className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors">
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <a href="https://www.linkedin.com/in/david-viejo/" target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                <Linkedin className="w-4 h-4 mr-2 text-[#0A66C2]" /> LinkedIn
              </a>
              <a href="#" className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                 <Twitter className="w-4 h-4 mr-2 text-slate-800" /> @DavidViejoSEO
              </a>
              <a href="https://agenciaseo.eu" target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                <Globe className="w-4 h-4 mr-2 text-blue-600" /> agenciaSEO.eu
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-slate-200 max-w-7xl mx-auto my-8"></div>

      {/* Experience Section */}
      <section id="experience" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-8">Trayectoria Profesional</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-slate-800 font-bold text-lg">Consultor SEO Senior</h3>
                <p className="text-orange-500 text-sm font-medium mb-1">agenciaSEO.eu</p>
                <p className="text-slate-400 text-xs mb-4">sept. 2024 - actualidad • Remoto</p>
                <p className="text-slate-600 text-sm leading-relaxed">
                   Consultoría SEO especializada en auditorías técnicas, arquitectura de sitios y estrategia
                   de posicionamiento para grandes cuentas de e-commerce y servicios.
                </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-slate-800 font-bold text-lg">Consultor SEO Freelance</h3>
                <p className="text-orange-500 text-sm font-medium mb-1">David Viejo</p>
                <p className="text-slate-400 text-xs mb-4">dic. 2020 - actualidad • Zaragoza</p>
                <p className="text-slate-600 text-sm leading-relaxed">
                   Gestión integral de estrategia SEO para clientes propios. Diseño web optimizado,
                   linkbuilding y optimización de ROI.
                </p>
            </div>

             {/* Card 3 */}
             <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-slate-800 font-bold text-lg">Head of SEO</h3>
                <p className="text-orange-500 text-sm font-medium mb-1">BirdCom</p>
                <p className="text-slate-400 text-xs mb-4">oct. 2023 - sept. 2024 • Zaragoza</p>
                <p className="text-slate-600 text-sm leading-relaxed">
                   Liderazgo de equipo SEO (7 personas). Gestión de proyectos de alto ticket,
                   formación interna y desarrollo de roadmap estratégico.
                </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-slate-800 font-bold text-lg">Consultor SEO Manager</h3>
                <p className="text-orange-500 text-sm font-medium mb-1">BirdCom</p>
                <p className="text-slate-400 text-xs mb-4">ene. 2022 - oct. 2023 • Zaragoza</p>
                <p className="text-slate-600 text-sm leading-relaxed">
                    Gestión simultánea de hasta 13 proyectos. Implementación de IA en procesos SEO
                    y alta retención de clientes.
                </p>
            </div>

             {/* Card 5 */}
             <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-slate-800 font-bold text-lg">Especialista SEO</h3>
                <p className="text-orange-500 text-sm font-medium mb-1">BirdCom</p>
                <p className="text-slate-400 text-xs mb-4">feb. 2021 - ene. 2022 • Zaragoza</p>
                <p className="text-slate-600 text-sm leading-relaxed">
                    Ejecución de estrategias SEO, auditorías técnicas y campañas de linkbuilding
                    como primer integrante del departamento.
                </p>
            </div>
             {/* Card 6 */}
             <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-slate-800 font-bold text-lg">SEO & CM</h3>
                <p className="text-orange-500 text-sm font-medium mb-1">Óptima Web</p>
                <p className="text-slate-400 text-xs mb-4">jul. 2020 - dic. 2020 • Zaragoza</p>
                <p className="text-slate-600 text-sm leading-relaxed">
                    Prácticas de máster enfocadas en estrategias SEO, diseño web y gestión de redes sociales.
                </p>
            </div>
          </div>
      </section>

      <div className="w-full h-px bg-slate-200 max-w-7xl mx-auto my-8"></div>

      {/* Clients Area - Proyectos Activos */}
      <section id="projects" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-8">Proyectos Activos — Área de Clientes</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} className="text-slate-400" />
          </div>
        ) : combinedClients.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
             <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 font-medium">No hay proyectos activos visibles.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {combinedClients.map((client) => (
              <div
                key={client.slug}
                className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-64 hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-blue-900 truncate" title={client.name}>
                      {client.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {client.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-3">
                    {client.description || 'Proyecto de consultoría SEO.'}
                  </p>
                </div>
                <button
                  onClick={() => handleAccess(client)}
                  className="bg-[#FF8A65] hover:bg-[#FF7043] text-white py-2 px-6 rounded-full text-sm font-medium w-max transition-colors shadow-sm"
                >
                  <span className="mr-1">›</span> Acceder
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="w-full h-px bg-slate-200 max-w-7xl mx-auto my-8"></div>

      {/* Certifications */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Certificaciones</h2>
          <div className="flex flex-wrap gap-4">
             <div className="bg-slate-100 px-4 py-2 rounded border border-slate-200 flex items-center text-slate-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4 text-orange-500 mr-2" /> Google Certified
             </div>
             <div className="bg-slate-100 px-4 py-2 rounded border border-slate-200 flex items-center text-slate-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4 text-orange-500 mr-2" /> HubSpot Certified
             </div>
             <div className="bg-slate-100 px-4 py-2 rounded border border-slate-200 flex items-center text-slate-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4 text-orange-500 mr-2" /> SEO Técnico Avanzado
             </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} David Viejo — agenciaSEO.eu · Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
