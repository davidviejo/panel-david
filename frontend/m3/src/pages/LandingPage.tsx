import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="bg-gray-900 text-white py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">David Viejo</h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-8">SEO Consultant & Growth Specialist</p>
          <div className="flex justify-center space-x-4 mb-8">
            <span className="bg-blue-600 text-xs px-2 py-1 rounded">Technical SEO</span>
            <span className="bg-green-600 text-xs px-2 py-1 rounded">Growth Hacking</span>
            <span className="bg-purple-600 text-xs px-2 py-1 rounded">Automation</span>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Especializado en estrategias SEO de alto impacto, automatización de procesos y crecimiento orgánico para grandes marcas y startups.
          </p>
        </div>
      </header>

      {/* Experience Section */}
      <section className="py-16 px-4 md:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Trayectoria</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-2">Senior SEO Manager</h3>
              <p className="text-gray-500 text-sm mb-4">2020 - Presente</p>
              <p className="text-gray-700">Liderando estrategias internacionales para clientes enterprise, gestionando migraciones complejas y equipos multidisciplinares.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-2">SEO Specialist & Developer</h3>
              <p className="text-gray-500 text-sm mb-4">2017 - 2020</p>
              <p className="text-gray-700">Desarrollo de herramientas internas de automatización y auditorías técnicas profundas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-gray-800">Certificaciones</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium border border-gray-200">Google Analytics IQ</span>
            <span className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium border border-gray-200">Google Ads Search</span>
            <span className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium border border-gray-200">HubSpot Inbound</span>
            <span className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium border border-gray-200">Python for Data Science</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-6">¿Trabajamos juntos?</h2>
        <p className="mb-8 text-gray-400">Acceso exclusivo para clientes activos.</p>
        <button
          onClick={() => navigate('/clientes')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded transition duration-300"
        >
          Acceso Clientes
        </button>
      </section>

      <footer className="bg-gray-950 text-gray-500 py-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} David Viejo. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
