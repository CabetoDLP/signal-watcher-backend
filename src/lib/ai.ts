import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", // Usar versión 1.5 en lugar de 2.5 (la actual)
});

export const analyzeEvent = async (description: string) => {
  // Prompt mejorado para forzar JSON puro
  const prompt = `
  Analiza este evento de seguridad y devuelve SOLAMENTE un JSON válido SIN marcas de código:
  Evento: "${description.replace(/"/g, '\\"')}"

  Estructura requerida:
  {
    "summary": "resumen conciso del evento",
    "severity": "LOW|MEDIUM|HIGH|CRITICAL",
    "suggestedAction": "acción recomendada"
  }
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json", // Forzar formato JSON
      },
    });

    let response = await result.response.text();
    
    // Limpieza adicional por si Gemini no obedece
    response = response.replace(/```json|```/g, '').trim();
    
    return JSON.parse(response);
  } catch (error) {
    console.error("Error al analizar evento:", error);
    return {
      summary: "Error en el análisis automático",
      severity: "MEDIUM",
      suggestedAction: "Revisar manualmente"
    };
  }
};