
import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const improveText = async (text: string, context: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return text;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um assistente administrativo operacional. Reescreva o texto a seguir para ser mais profissional, conciso e claro, em Português do Brasil. Contexto: ${context}. Texto: "${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text;
  }
};

export const analyzeSafetyRisk = async (description: string): Promise<{ suggestion: string, riskLevel: string }> => {
  const ai = getAIClient();
  if (!ai) return { suggestion: "N/A", riskLevel: "MEDIUM" };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise este relato de segurança: "${description}". Forneça uma ação corretiva curta e sugerida (em Português) e um nível de risco estimado (LOW, MEDIUM, HIGH). Retorne estritamente no formato JSON: {"suggestion": "...", "riskLevel": "..."}`,
       config: {
        responseMimeType: "application/json",
      },
    });
    
    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { suggestion: "Erro ao analisar risco", riskLevel: "MEDIUM" };
  }
};

export const generateDashboardSummary = async (dataContext: string): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "Resumo não disponível sem API Key.";
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é um analista de painel operacional. Com base nas contagens de dados resumidos a seguir, forneça um briefing diário breve e profissional (em PT-BR) com foco nas áreas que precisam de atenção. Dados: ${dataContext}`,
      });
      return response.text || "Sem dados suficientes.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Erro ao gerar resumo.";
    }
  };

export const generateProductImage = async (productName: string, description?: string): Promise<string | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const prompt = `Generate a realistic, high-quality product image of: ${productName}. ${description ? `Details: ${description}` : ''}. White background, professional product photography style. Isolated object.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    // Iterate to find image part
    if (response.candidates) {
        for (const candidate of response.candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};
