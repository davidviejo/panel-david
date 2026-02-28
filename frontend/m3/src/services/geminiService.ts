const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = sessionStorage.getItem('portal_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Genera un análisis SEO proxyando a través del backend para ocultar la API Key.
 *
 * @param {string} content - El contenido o texto a analizar.
 * @param {'headline' | 'audit' | 'schema' | 'calendar' | 'competitor' | 'tone' | 'roadmap'} type - El tipo de análisis a realizar.
 * @param {string} [vertical] - El vertical del cliente ('media', 'ecom', 'local') para personalizar el roadmap.
 * @returns {Promise<string>} El resultado del análisis generado por la IA o un mensaje de error.
 */
export const generateSEOAnalysis = async (
  content: string,
  type: 'headline' | 'audit' | 'schema' | 'calendar' | 'competitor' | 'tone' | 'roadmap',
  vertical?: string,
): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/api/ai/seo-analysis`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content, type, vertical }),
    });

    const data = await response.json();

    if (!response.ok) {
      return `Error: ${data.error || 'Problema de conexión con el backend.'}`;
    }

    return data.result || 'No se generó análisis.';
  } catch (error) {
    console.error('Backend Gemini API Proxy Error:', error);
    return 'Error generando análisis. Por favor intenta más tarde.';
  }
};

/**
 * Evalúa un titular para SEO y CTR proxyando a través del backend.
 *
 * @param {string} headline - El titular a evaluar.
 * @param {string} keywords - Las palabras clave objetivo.
 * @returns {Promise<string>} Evaluación del titular con puntuación y sugerencias.
 */
export const evaluateHeadlineChallenge = async (
  headline: string,
  keywords: string,
): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/api/ai/headline-challenge`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ headline, keywords }),
    });

    const data = await response.json();

    if (!response.ok) {
      return `PUNTUACION: 0\nFEEDBACK: ${data.error || 'Error del servidor.'}\nMEJOR_VERSION: N/A`;
    }

    return data.result || 'PUNTUACION: 0\nFEEDBACK: Error en la respuesta.\nMEJOR_VERSION: N/A';
  } catch (error) {
    console.error('Backend Gemini API Proxy Error:', error);
    return 'PUNTUACION: 0\nFEEDBACK: Error de conexión.\nMEJOR_VERSION: Intenta de nuevo.';
  }
};
