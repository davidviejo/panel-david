import React from 'react';
import { Linkedin, Twitter, Globe } from 'lucide-react';

const LandingPage: React.FC = () => {
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
              <a href="#servicios" className="hover:text-orange-500 transition-colors">
                Servicios
              </a>
              <a href="#metodologia" className="hover:text-orange-500 transition-colors">
                Metodología
              </a>
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
              {[
                'SEO Técnico',
                'Arquitectura Web',
                'SEM',
                'Web Analytics',
                'E-commerce',
                'Link Building',
                'Content Strategy',
              ].map((skill) => (
                <span
                  key={skill}
                  className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <a
                href="https://www.linkedin.com/in/david-viejo/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Linkedin className="w-4 h-4 mr-2 text-[#0A66C2]" /> LinkedIn
              </a>
              <a
                href="#"
                className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Twitter className="w-4 h-4 mr-2 text-slate-800" /> @DavidViejoSEO
              </a>
              <a
                href="https://agenciaseo.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Globe className="w-4 h-4 mr-2 text-blue-600" /> agenciaSEO.eu
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-slate-200 max-w-7xl mx-auto my-8"></div>

      {/* 2. Strategic Capabilities (Servicios) */}
      <section id="servicios" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-900 tracking-tight leading-tight mb-8">
          Consultoría SEO estratégica para escalar tráfico y negocio
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-800 font-bold text-lg mb-2">Estrategia SEO</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Definición de roadmap SEO basado en negocio y competencia.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-800 font-bold text-lg mb-2">SEO internacional</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Estrategias de posicionamiento en múltiples mercados.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-800 font-bold text-lg mb-2">SEO técnico</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Optimización de rastreo, indexación y arquitectura.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-800 font-bold text-lg mb-2">Keyword Intelligence</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Investigación avanzada de oportunidades de tráfico.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-800 font-bold text-lg mb-2">Autoridad y link building</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Construcción estratégica de autoridad.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-800 font-bold text-lg mb-2">SEO analytics</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Análisis de datos y mejora continua.
            </p>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-slate-200 max-w-7xl mx-auto my-8"></div>

      {/* 3. Metodología SEO */}
      <section id="metodologia" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-900 tracking-tight leading-tight mb-8">
          Metodología de consultoría SEO
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-800 font-bold text-lg mb-4">Diagnóstico SEO técnico</h3>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 font-semibold">Auditoría completa:</p>
            <ul className="space-y-2 text-slate-600 text-sm list-disc pl-4">
              <li>indexación</li>
              <li>arquitectura</li>
              <li>rendimiento</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-800 font-bold text-lg mb-4">Inteligencia competitiva</h3>
            <ul className="space-y-2 text-slate-600 text-sm list-disc pl-4">
              <li>análisis SERP</li>
              <li>análisis de competencia</li>
              <li>oportunidades de posicionamiento</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-800 font-bold text-lg mb-4">Estrategia de crecimiento</h3>
            <ul className="space-y-2 text-slate-600 text-sm list-disc pl-4">
              <li>roadmap SEO</li>
              <li>clusters de contenido</li>
              <li>autoridad</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-800 font-bold text-lg mb-4">Data analytics</h3>
            <ul className="space-y-2 text-slate-600 text-sm list-disc pl-4">
              <li>medición</li>
              <li>optimización continua</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-slate-200 max-w-7xl mx-auto my-8"></div>

      {/* 4. SEO Internacional */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-900 tracking-tight leading-tight mb-6">
          Estrategias SEO en más de 20 mercados internacionales
        </h2>
        <div className="mb-6">
          <ul className="space-y-2 text-slate-600 text-lg list-disc pl-4">
            <li>experiencia en mercados</li>
            <li>SEO multilingüe</li>
            <li>SEO para expansión internacional</li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {['consultor SEO internacional', 'SEO global', 'SEO multilingüe'].map((keyword) => (
            <span
              key={keyword}
              className="px-4 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold"
            >
              {keyword}
            </span>
          ))}
        </div>
      </section>

      <div className="w-full h-px bg-slate-200 max-w-7xl mx-auto my-8"></div>

      {/* 5. Expertise / Contenido estratégico */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-900 tracking-tight leading-tight mb-8">
          Estrategias SEO y análisis del mercado
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 flex items-center justify-center h-32 text-slate-500 font-medium hover:bg-slate-100 transition-colors cursor-pointer">
            Informes
          </div>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 flex items-center justify-center h-32 text-slate-500 font-medium hover:bg-slate-100 transition-colors cursor-pointer">
            Análisis
          </div>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 flex items-center justify-center h-32 text-slate-500 font-medium hover:bg-slate-100 transition-colors cursor-pointer">
            Estudios SEO
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-slate-200 max-w-7xl mx-auto my-8"></div>

      {/* 6. Lead Magnet */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-blue-50 rounded-2xl border border-blue-100 text-center my-12">
        <h2 className="text-3xl font-bold text-blue-900 tracking-tight leading-tight mb-4">
          Pronóstico SEO 2026
        </h2>
        <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
          Descarga nuestro informe sobre captación y autoridad para prepararte ante los retos del futuro del posicionamiento orgánico.
        </p>
        <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-md transition-colors">
          Descargar Informe
        </button>
      </section>

      <div className="w-full h-px bg-slate-200 max-w-7xl mx-auto my-8"></div>

      {/* 7. Insights / Artículos */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-900 tracking-tight leading-tight mb-8">
          Insights sobre estrategia SEO
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
            <h3 className="text-slate-800 font-bold text-lg mb-2">Futuro del SEO</h3>
            <p className="text-slate-500 text-sm">Tendencias y evolución del algoritmo.</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
            <h3 className="text-slate-800 font-bold text-lg mb-2">Análisis SERP</h3>
            <p className="text-slate-500 text-sm">Desgranando la intención de búsqueda y resultados enriquecidos.</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
            <h3 className="text-slate-800 font-bold text-lg mb-2">Estrategias de contenido</h3>
            <p className="text-slate-500 text-sm">Creación de autoridad semántica a través de clusters.</p>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-slate-200 max-w-7xl mx-auto my-8"></div>

      {/* 8. Preguntas frecuentes sobre consultoría SEO */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-900 tracking-tight leading-tight mb-8 text-center">
          Preguntas frecuentes sobre consultoría SEO
        </h2>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-slate-800 font-bold text-lg mb-2">¿Qué es un consultor SEO?</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Un consultor SEO es un especialista en posicionamiento en buscadores que analiza, diseña y ejecuta estrategias para mejorar la visibilidad de un sitio web en Google y otros motores de búsqueda. Su trabajo consiste en identificar oportunidades de tráfico orgánico, optimizar la estructura y el contenido de la web, y desarrollar estrategias que permitan atraer usuarios cualificados.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-slate-800 font-bold text-lg mb-2">¿Qué hace un consultor SEO?</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Un consultor SEO analiza la situación actual de una web, estudia el mercado y la competencia, y define estrategias para mejorar el posicionamiento orgánico. Entre sus tareas se encuentran la auditoría SEO, investigación de palabras clave, optimización técnica, estrategia de contenidos y desarrollo de autoridad mediante enlaces.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-slate-800 font-bold text-lg mb-2">¿Cuándo contratar un consultor SEO?</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Es recomendable contratar un consultor SEO cuando una web no aparece en Google, ha perdido tráfico orgánico, quiere escalar su crecimiento digital o necesita una estrategia clara de posicionamiento.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-slate-800 font-bold text-lg mb-2">¿Cuánto cuesta un consultor SEO?</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              El coste de un consultor SEO depende del proyecto, la complejidad del sitio web y los objetivos de crecimiento. Los servicios pueden contratarse por horas, por proyecto o mediante consultoría mensual.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-slate-800 font-bold text-lg mb-2">¿Cuánto tarda el SEO en dar resultados?</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              El SEO suele mostrar resultados entre 3 y 6 meses, dependiendo de la competencia del sector, la autoridad del dominio y la calidad de la estrategia aplicada.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-slate-800 font-bold text-lg mb-2">¿Consultor SEO o agencia SEO?</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Un consultor SEO suele ofrecer un enfoque más estratégico y personalizado, mientras que una agencia SEO cuenta con un equipo más amplio para ejecutar diferentes áreas del posicionamiento.
            </p>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-slate-200 max-w-7xl mx-auto my-8"></div>

      {/* Clients Area - Proyectos Activos */}
      <section id="projects" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-8">
          Proyectos Activos — Área de Clientes
        </h2>

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

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          <p>
            © {new Date().getFullYear()} David Viejo — agenciaSEO.eu · Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
