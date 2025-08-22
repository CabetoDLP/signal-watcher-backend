import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// 👇 Puedes cambiar el modelo real si lo necesitas
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash", 
});

// ⚡ Si pones MOCK_AI=true en .env, se activa el mock
const USE_MOCK = process.env.MOCK_AI === "true";

export const analyzeEvent = async (description: string) => {
  if (USE_MOCK) {
    // 🔹 Simulación rápida sin llamar a Gemini
    return {
      summary: `Evento simulado: ${description}`,
      severity: "LOW",
      suggestedAction: "Revisar manualmente"
    };
  }

  const prompt = `
  Analiza este evento de seguridad y devuelve SOLAMENTE un JSON válido:
  Evento: "${description.replace(/"/g, '\\"')}"

  Estructura:
  {
    "summary": "...",
    "severity": "LOW|MEDIUM|HIGH|CRITICAL",
    "suggestedAction": "..."
  }
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const response = result.response.text();
    return JSON.parse(response);

  } catch (error: any) {
    console.error("Error al analizar evento:", error?.response || error);
    return {
      summary: "Error en el análisis automático",
      severity: "MEDIUM",
      suggestedAction: "Revisar manualmente"
    };
  }
};
