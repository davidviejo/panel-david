import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Linkedin, Globe, CheckCircle, MapPin } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-[#FF7F50] selection:text-white">
      {/* Navbar */}
      <nav className="fixed w-full bg-slate-900/90 backdrop-blur-md z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#FF7F50] rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
              <span className="font-bold text-xl text-white tracking-tight">David Viejo</span>
            </div>
            <div className="hidden md:flex space-x-8 items-center text-sm font-medium text-slate-400">
              <a href="#about" className="hover:text-[#FF7F50] transition-colors">Acerca de</a>
              <a href="#experience" className="hover:text-[#FF7F50] transition-colors">Experiencia</a>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-500 font-semibold">Disponible</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/clientes')}
              className="bg-[#FF7F50] hover:bg-[#E66A3C] text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-[#FF7F50]/20 hover:shadow-[#FF7F50]/30 flex items-center"
            >
              Acceso Clientes <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
              David Viejo <br/>
              <span className="text-[#FF7F50]">Consultor SEO técnico & estratégico</span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
              Resuelvo cuellos de botella SEO que frenan el crecimiento | AgenciaSEO.eu
            </p>

            <div className="flex items-center text-slate-500 text-sm">
               <MapPin className="w-4 h-4 mr-2" />
               Zaragoza, Aragón, España
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              {['SEO Técnico', 'Estrategia', 'Auditorías', 'IA para SEO', 'Dashboards'].map((skill) => (
                <span key={skill} className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm font-medium border border-slate-700">
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-4 pt-6">
              <a href="https://www.linkedin.com/in/david-viejo/" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-[#0A66C2] transition-colors border border-slate-800 rounded-lg hover:border-[#0A66C2]/50 bg-slate-900">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://agenciaseo.eu" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-[#FF7F50] transition-colors border border-slate-800 rounded-lg hover:border-[#FF7F50]/50 bg-slate-900">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center relative">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 p-2 relative z-10">
               {/* Placeholder for avatar */}
               <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-6xl text-slate-700 border-4 border-slate-800 shadow-2xl overflow-hidden">
                 DV
               </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-10 w-20 h-20 bg-[#FF7F50]/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-800/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-6">Acerca de</h2>
                    <p className="text-slate-300 leading-relaxed mb-4">
                        Tu web puede tener buen contenido, artículos semanales y diseño moderno… <br/>
                        Pero si Google no lo rastrea, no lo interpreta o no lo prioriza, es como si no existiera.
                    </p>
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 my-6">
                        <p className="text-[#FF7F50] font-bold mb-2">💣 El mayor error en SEO: pensar que publicar ≡ posicionar.</p>
                        <p className="text-slate-400 mb-2">📉 El resultado:</p>
                        <ul className="list-disc list-inside text-slate-400 space-y-1 ml-4">
                            <li>Páginas “descubiertas pero no indexadas”</li>
                            <li>Trafico sin conversión</li>
                            <li>Keywords bien elegidas, mal atacadas</li>
                            <li>Equipos internos frustrados</li>
                        </ul>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        🚧 <strong>Aquí es donde intervengo:</strong><br/>
                        Soy David Viejo, consultor SEO técnico y estratégico. Trabajo con negocios que tienen potencial, pero están atascados.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center text-slate-300"><CheckCircle className="w-4 h-4 text-green-500 mr-2"/> +70 proyectos optimizados</div>
                        <div className="flex items-center text-slate-300"><CheckCircle className="w-4 h-4 text-green-500 mr-2"/> Uso de IA y automatización</div>
                        <div className="flex items-center text-slate-300"><CheckCircle className="w-4 h-4 text-green-500 mr-2"/> Dashboards de negocio</div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-8">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">¿QUÉ OFREZCO?</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start"><span className="text-[#FF7F50] mr-2">💡</span> <span className="text-slate-300"><strong>1. Servicio SEO mensual</strong> → me encargo de todo.</span></li>
                            <li className="flex items-start"><span className="text-[#FF7F50] mr-2">💡</span> <span className="text-slate-300"><strong>2. Auditoría única</strong> → detecta bloqueos y oportunidades.</span></li>
                            <li className="flex items-start"><span className="text-[#FF7F50] mr-2">💡</span> <span className="text-slate-300"><strong>3. Consultoría externa</strong> → evalúa si tu agencia lo está haciendo bien.</span></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">¿CÓMO TRABAJO?</h3>
                         <ul className="space-y-2 text-slate-300">
                            <li>– Sin humo</li>
                            <li>– Sin vender clicks</li>
                            <li>– Solo foco en rentabilidad, rastreo y crecimiento sostenido</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-bold text-[#FF7F50] uppercase tracking-wider mb-12">Trayectoria Profesional</h2>

          <div className="space-y-8 max-w-4xl mx-auto">

            {/* Role 1 */}
            <div className="group relative pl-8 border-l-2 border-slate-800 hover:border-[#FF7F50] transition-colors">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 group-hover:bg-[#FF7F50] transition-colors border-2 border-slate-900"></div>
                <div className="mb-1 text-sm text-[#FF7F50] font-semibold">sept. 2024 - actualidad</div>
                <h3 className="text-2xl font-bold text-white">Consultor SEO Senior</h3>
                <h4 className="text-lg text-slate-400 mb-4">agenciaSEO.eu · Remoto</h4>
                <p className="text-slate-400 mb-4">
                    Puedo ayudarte a entrar entre nuestros clientes TOP 📨 <br/>
                    🥁 Clientes internacionales | 🥁 Clientes comprometidos | 💙 Clientes que confían en los resultados
                </p>
            </div>

            {/* Role 2 */}
             <div className="group relative pl-8 border-l-2 border-slate-800 hover:border-[#FF7F50] transition-colors">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 group-hover:bg-[#FF7F50] transition-colors border-2 border-slate-900"></div>
                <div className="mb-1 text-sm text-slate-500">dic. 2020 - actualidad</div>
                <h3 className="text-2xl font-bold text-white">Consultor SEO • Posicionamiento SEO</h3>
                <h4 className="text-lg text-slate-400 mb-4">Freelance · Zaragoza (Remoto)</h4>
                <div className="text-slate-400 space-y-2">
                    <p>🚨 Tu proyecto. Mi tiempo. Si quieres que sea tu consultor SEO, ¡háblame! Busco retos ambiciosos.</p>
                    <p>✅ Haciéndote ganar dinero (con SEO)<br/>✅ Diseño web (con SEO)<br/>✅ Linkbuilding (mínimo 200€/mes)</p>
                    <p className="italic text-slate-500">🏆 Hall of Fame: Inmobiliaria (Comunidad más grande de España), Escape Room (Pioneros), Armería (Liquidación de negocio).</p>
                </div>
            </div>

            {/* Role 3 */}
            <div className="group relative pl-8 border-l-2 border-slate-800 hover:border-[#FF7F50] transition-colors">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 group-hover:bg-[#FF7F50] transition-colors border-2 border-slate-900"></div>
                <div className="mb-1 text-sm text-slate-500">oct. 2023 - sept. 2024</div>
                <h3 className="text-xl font-bold text-white">Head of SEO | Siguiente Nivel ⏫</h3>
                <h4 className="text-lg text-slate-400 mb-4">BirdCom · Zaragoza</h4>
                <div className="text-slate-400 text-sm">
                    <p className="mb-2"><strong>Gestión:</strong> Proyectos de ticket alto, Equipazo SEO (7) + Contenidos (4), Implementación de metodologías e IA.</p>
                    <p className="mb-2"><strong>Tareas:</strong> Formación interna, Auditorias, Migraciones, Tendencias, Linkbuilding, Keyword Research, Roadmap.</p>
                    <p><strong>Herramientas:</strong> Semrush, Screaming Frog + Logs, GSC, GA4, Looker Studio, SEOLyze, Dinorank.</p>
                </div>
            </div>

            {/* Role 4 */}
            <div className="group relative pl-8 border-l-2 border-slate-800 hover:border-[#FF7F50] transition-colors">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 group-hover:bg-[#FF7F50] transition-colors border-2 border-slate-900"></div>
                <div className="mb-1 text-sm text-slate-500">ene. 2022 - oct. 2023</div>
                <h3 className="text-xl font-bold text-white">Consultor SEO Manager</h3>
                <h4 className="text-lg text-slate-400 mb-4">BirdCom · Zaragoza</h4>
                <p className="text-slate-400 text-sm mb-2">Hasta 13 Proyectos Simultáneos | Implementación de AI</p>
                <p className="text-slate-400 text-sm">¿95-99% de retención en clientes? Retención basada en talento y flexibilidad.</p>
            </div>

             {/* Role 5 */}
             <div className="group relative pl-8 border-l-2 border-slate-800 hover:border-[#FF7F50] transition-colors">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 group-hover:bg-[#FF7F50] transition-colors border-2 border-slate-900"></div>
                <div className="mb-1 text-sm text-slate-500">feb. 2021 - ene. 2022</div>
                <h3 className="text-xl font-bold text-white">Especialista SEO</h3>
                <h4 className="text-lg text-slate-400 mb-4">BirdCom · Zaragoza</h4>
                <p className="text-slate-400 text-sm">Primer integrante del departamento SEO. Ejecución de estrategia, auditorías y linkbuilding.</p>
            </div>

             {/* Role 6 */}
             <div className="group relative pl-8 border-l-2 border-slate-800 hover:border-[#FF7F50] transition-colors">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 group-hover:bg-[#FF7F50] transition-colors border-2 border-slate-900"></div>
                <div className="mb-1 text-sm text-slate-500">jul. 2020 - dic. 2020</div>
                <h3 className="text-xl font-bold text-white">Consultor SEO & Community Manager</h3>
                <h4 className="text-lg text-slate-400 mb-4">Óptima Web · Zaragoza</h4>
                <p className="text-slate-400 text-sm">Estrategias SEO, Diseño web, Redes Sociales. Prácticas Máster.</p>
            </div>

             {/* Role 7 */}
             <div className="group relative pl-8 border-l-2 border-slate-800 hover:border-[#FF7F50] transition-colors">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 group-hover:bg-[#FF7F50] transition-colors border-2 border-slate-900"></div>
                <div className="mb-1 text-sm text-slate-500">mar. 2020 - jun. 2020</div>
                <h3 className="text-xl font-bold text-white">Responsable de Comunicación</h3>
                <h4 className="text-lg text-slate-400 mb-4">Colegio Montessori · Zaragoza</h4>
                <p className="text-slate-400 text-sm">Implantación y actualización del blog MontessoriNews. Planificación de contenidos RRSS.</p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="bg-slate-900 rounded-3xl p-12 text-center relative overflow-hidden border border-slate-800">
             <div className="relative z-10">
               <h2 className="text-3xl font-bold text-white mb-4">¿Hablamos?</h2>
               <p className="text-slate-400 mb-8 max-w-lg mx-auto">Si no estás creciendo, hablemos. Porque el SEO que funciona… no es el que te han contado.</p>
               <button
                 onClick={() => navigate('/clientes')}
                 className="bg-[#FF7F50] hover:bg-[#E66A3C] text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg shadow-[#FF7F50]/50"
               >
                 Entrar al Área de Clientes
               </button>
             </div>

             {/* Abstract Background */}
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
               <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF7F50] rounded-full blur-3xl"></div>
               <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
             </div>
           </div>
        </div>
      </section>

      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600 text-sm">
          <p>© {new Date().getFullYear()} David Viejo. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
