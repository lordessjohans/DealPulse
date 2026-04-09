import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeImageForSearch(base64Image: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Identify this product and provide 3-5 keywords for searching similar items on e-commerce sites like AliExpress or Temu. Return only the keywords separated by commas." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ]
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "";
  }
}

export async function searchGoogleShoppingDeals() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Find 5 of the best trending daily deals currently available on Google Shopping. For each deal, provide the title, price, original price, image URL (if possible, otherwise a placeholder), and a direct link. Return the results as a JSON array.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              price: { type: Type.NUMBER },
              originalPrice: { type: Type.NUMBER },
              imageUrl: { type: Type.STRING },
              productUrl: { type: Type.STRING },
              source: { type: Type.STRING },
              category: { type: Type.STRING },
              trendingScore: { type: Type.NUMBER }
            },
            required: ["title", "price", "productUrl"]
          }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Google Shopping search failed:", error);
    return [];
  }
}
