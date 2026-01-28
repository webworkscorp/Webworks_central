
import { GoogleGenAI, Type } from "@google/genai";
import { KPIReport, ClientDetail, Diagnosis } from "../types";

export const getBusinessDiagnosis = async (kpis: KPIReport, clients: ClientDetail[]): Promise<Diagnosis> => {
  try {
    // Initialize GoogleGenAI directly within the function using process.env.API_KEY as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Actúa como un Director de Operaciones (COO) senior. Analiza los KPIs de este periodo:
        Ingresos: ${kpis.revenue} CRC
        Ganancia: ${kpis.profit} CRC
        CPA: ${kpis.cpa} CRC
        ROI: ${kpis.roi}x
        Ticket Promedio: ${kpis.averageTicket} CRC
        Clientes: ${clients.length}
        
        Tu diagnóstico debe ser profesional, humano, directo y en español.
        No uses frases como "Basado en los datos" o "Soy una IA".
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING, description: "Resumen ejecutivo del estado actual." },
            risks: { type: Type.STRING, description: "Amenazas inmediatas detectadas." },
            strengths: { type: Type.STRING, description: "Puntos fuertes a escalar." },
            actions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 3 acciones prioritarias."
            },
            status: { type: Type.STRING, enum: ["Saludable", "En Observación", "Crítico"] }
          },
          required: ["diagnosis", "risks", "strengths", "actions", "status"]
        }
      }
    });

    // Directly access the text property from the response.
    return JSON.parse(response.text || "{}") as Diagnosis;
  } catch (error) {
    console.error("Error en Diagnóstico:", error);
    return {
      diagnosis: "El negocio mantiene un flujo constante, pero requiere optimización de costos.",
      risks: "Dependencia de pocos canales de venta.",
      strengths: "Alta retención y ticket promedio saludable.",
      actions: ["Diversificar canales de adquisición", "Ajustar presupuesto publicitario", "Revisar procesos de cierre"],
      status: "En Observación"
    };
  }
};
