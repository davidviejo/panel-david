import { GoogleGenAI } from '@google/genai';

// Initialize AI lazily to avoid crash if env var is missing during build/init
/**
 * Inicializa el cliente de Google GenAI de forma perezosa.
 * @returns {GoogleGenAI | null} Instancia del cliente de Google GenAI o null si falta la API Key.
 */
const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY is missing. AI features will not work.');
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Genera un análisis SEO utilizando Google Gemini.
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
  const ai = getAIClient();
  if (!ai) return 'Error: API Key no configurada. Verifica las variables de entorno.';

  const model = 'gemini-2.0-flash';

  // STRICT Anti-Hallucination Instruction
  const systemInstruction =
    'CRITICAL INSTRUCTION: You are an SEO Expert Tool. Do NOT invent, simulate, or hallucinate data, metrics, traffic numbers, or statistics. If the user input does not contain enough information to perform a specific analysis (e.g. they provide a URL but you cannot crawl it), explicitly state what information is missing and provide theoretical advice based ONLY on the visible text provided. Base your analysis STRICTLY on the provided input text and general SEO best practices.';

  let prompt = '';
  if (type === 'headline') {
    prompt = `${systemInstruction}
    Actúa como un Experto SEO. Analiza el siguiente texto y proporciona 3 variaciones optimizadas de H1 y una Meta Description (máx 155 caracteres) optimizada para CTR. Responde en Español.
    
    Texto: "${content}"`;
  } else if (type === 'audit') {
    prompt = `${systemInstruction}
    Actúa como Auditor SEO Técnico. Proporciona una lista de comprobaciones basada en el input: "${content}". Si el input es una URL, menciona claramente que NO puedes rastrear la web en tiempo real pero da recomendaciones generales basadas en la estructura visible de la URL o el tema inferido. Responde en Español.`;
  } else if (type === 'schema') {
    prompt = `${systemInstruction}
    Actúa como Desarrollador SEO Técnico. Genera un marcado Schema 'NewsArticle' JSON-LD válido para: "${content}". Usa marcadores genéricos (ej: "URL_AQUI", "FECHA_AQUI") para datos que no estén explícitamente en el texto. NO inventes autores o fechas si no se dan. Muestra SOLO el código JSON.`;
  } else if (type === 'calendar') {
    prompt = `${systemInstruction}
    Actúa como Redactor Jefe. Crea un calendario de contenidos de 5 días enfocado en el tema: "${content}". Sugiere ángulos 'Breaking News' y 'Evergreen'. Responde en Español.`;
  } else if (type === 'competitor') {
    prompt = `${systemInstruction}
    Actúa como Estratega SEO. Analiza la estrategia de contenido típica para un sitio del tipo: "${content}". Identifica oportunidades teóricas de "Océano Azul". NO inventes competidores ni métricas de tráfico. Responde en Español.`;
  } else if (type === 'tone') {
    prompt = `${systemInstruction}
    Actúa como Editor Senior. Analiza el tono de voz del texto. Da una puntuación del 1-10 en "Objetividad" basada SOLO en el texto.
    Texto: "${content}"`;
  } else if (type === 'roadmap') {
    const v = vertical || 'media';
    let role = 'Estratega SEO General';
    let focus = 'Visibilidad General';

    if (v === 'media') {
      role = 'Director SEO de Medio de Comunicación';
      focus = 'Google Discover, Top Stories, Velocidad';
    } else if (v === 'ecom') {
      role = 'Head of SEO para E-commerce';
      focus = 'Fichas de Producto, Categorías, Crawl Budget';
    } else if (v === 'local') {
      role = 'Especialista SEO Local';
      focus = 'Google Business Profile, Citaciones, Reseñas';
    } else if (v === 'national') {
      role = 'Consultor SEO Nacional';
      focus = 'Arquitectura Web, Contenidos, Autoridad de Marca';
    } else if (v === 'international') {
      role = 'Estratega SEO Internacional';
      focus = 'Hreflang, Localización, Dominios Globales';
    }

    prompt = `${systemInstruction}
    Actúa como ${role}. Crea un Roadmap Estratégico de 6 meses para: "${content}".
    Enfoque: ${focus}.
    Estructura (Markdown):
    1. Diagnóstico Inicial (Teórico basado en input)
    2. Fases (Mes 1-6)
    3. KPIs Recomendados (Genéricos para el vertical)

    Responde en Español.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || 'No se generó análisis.';
  } catch (error) {
    console.error('Gemini API Error:', error);
    return 'Error generando análisis. Por favor intenta más tarde.';
  }
};

/**
 * Evalúa un titular para SEO y CTR.
 *
 * @param {string} headline - El titular a evaluar.
 * @param {string} keywords - Las palabras clave objetivo.
 * @returns {Promise<string>} Evaluación del titular con puntuación y sugerencias.
 */
export const evaluateHeadlineChallenge = async (
  headline: string,
  keywords: string,
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return 'PUNTUACION: 0\nFEEDBACK: Falta API Key.\nMEJOR_VERSION: N/A';

  const model = 'gemini-2.0-flash';
  const prompt = `Puntúa este titular de última hora en una escala de 0-100 por impacto SEO y CTR.
  Keywords Objetivo: "${keywords}"
  Titular: "${headline}"
  
  Formato de salida:
  PUNTUACION: [número]
  FEEDBACK: [Una frase de crítica en Español]
  MEJOR_VERSION: [Una variación mejorada en Español]
  
  Sé estricto pero justo. Puntuaciones altas requieren match exacto de keyword y gancho emocional.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || 'PUNTUACION: 0\nFEEDBACK: Error.\nMEJOR_VERSION: N/A';
  } catch (error) {
    return 'PUNTUACION: 0\nFEEDBACK: Error de API.\nMEJOR_VERSION: Intenta de nuevo.';
  }
};
