import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, ExternalLink, Linkedin, Twitter, Globe, Award } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Navbar */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">David Viejo</span>
            </div>
            <div className="hidden md:flex space-x-8 items-center text-sm font-medium text-slate-600">
              <a href="#experience" className="hover:text-blue-600 transition-colors">Experiencia</a>
              <a href="#projects" className="hover:text-blue-600 transition-colors">Proyectos</a>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-600 font-semibold">Disponible</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/clientes')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 flex items-center"
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
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              David Viejo <br/>
              <span className="text-blue-600">Consultor SEO & Tech</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
              Especialista en SEO técnico, arquitecturas escalables y automatización.
              Ayudo a empresas a dominar las SERPs mediante estrategias basadas en datos y tecnología.
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              {['SEO Técnico', 'Python Automation', 'React / Next.js', 'Data Analysis', 'E-commerce'].map((skill) => (
                <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium border border-slate-200">
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-4 pt-6">
              <a href="#" className="p-2 text-slate-500 hover:text-blue-600 transition-colors border border-slate-200 rounded-lg hover:border-blue-200 bg-white">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 text-slate-500 hover:text-blue-400 transition-colors border border-slate-200 rounded-lg hover:border-blue-200 bg-white">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 text-slate-500 hover:text-purple-600 transition-colors border border-slate-200 rounded-lg hover:border-purple-200 bg-white">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center relative">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-tr from-blue-100 to-purple-100 p-2 relative z-10">
               {/* Placeholder for avatar */}
               <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-6xl text-blue-200 border-4 border-white shadow-2xl overflow-hidden">
                 DV
               </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-10 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-12">Trayectoria Profesional</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="group p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all bg-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Senior SEO Manager</h3>
                  <p className="text-blue-600 font-medium">Agencia Líder</p>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded">2020 - Presente</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Liderazgo de estrategias SEO para grandes cuentas. Implementación de automatizaciones con Python para auditorías técnicas y reporting.
              </p>
            </div>

            <div className="group p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all bg-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Tech SEO Specialist</h3>
                  <p className="text-blue-600 font-medium">E-commerce Global</p>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded">2018 - 2020</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Optimización de arquitectura web para más de 1M de URLs. Mejora de Core Web Vitals y estrategia de enlazado interno.
              </p>
            </div>

            <div className="group p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all bg-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Digital Marketing Consultant</h3>
                  <p className="text-blue-600 font-medium">Freelance</p>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded">2015 - 2018</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Consultoría integral para PYMEs. Desarrollo web, campañas PPC y posicionamiento orgánico local.
              </p>
            </div>

            <div className="group p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all bg-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Web Developer</h3>
                  <p className="text-blue-600 font-medium">Startup Tech</p>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded">2013 - 2015</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Desarrollo Full Stack con foco en rendimiento. Integración de APIs y optimización de bases de datos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications & CTA */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-8">Certificaciones</h2>
           <div className="flex flex-wrap gap-4 mb-20">
             {['Google Analytics Certified', 'HubSpot SEO', 'Advanced Python for Data Science', 'AWS Cloud Practitioner'].map((cert) => (
               <div key={cert} className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-600 text-sm">
                 <Award className="w-4 h-4 text-orange-500" />
                 <span>{cert}</span>
               </div>
             ))}
           </div>

           <div className="bg-slate-900 rounded-3xl p-12 text-center relative overflow-hidden">
             <div className="relative z-10">
               <h2 className="text-3xl font-bold text-white mb-4">¿Ya eres cliente?</h2>
               <p className="text-slate-400 mb-8 max-w-lg mx-auto">Accede a tu panel privado para ver el estado de tus proyectos y descargar informes detallados.</p>
               <button
                 onClick={() => navigate('/clientes')}
                 className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg shadow-blue-900/50"
               >
                 Entrar al Área de Clientes
               </button>
             </div>

             {/* Abstract Background */}
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
               <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
               <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
             </div>
           </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} David Viejo. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
