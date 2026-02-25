import { GoogleGenAI } from "@google/genai";

// We assume process.env.API_KEY is available as per instructions.
// If not available during a preview, this service will throw naturally.
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const getVisualKeyword = async (textChunk: string): Promise<string | null> => {
  if (!apiKey) {
    console.warn("No Gemini API Key found. Returning default keyword.");
    return "nature calm";
  }

  try {
    const prompt = `Analyze this Quranic verse translation. Provide a SINGLE, English visual keyword describing the physical environment or mood suitable for a background video (e.g., Sky, Ocean, Mountains, Stars, Desert, Rain, Flowers, Light).
    
    Constraints:
    1. STRICTLY NO HUMANS, no body parts, no faces.
    2. Focus on NATURE, SCENERY, or ABSTRACT visuals.
    3. If the verse mentions heaven/hell, use abstract terms like 'beautiful clouds' or 'fire abstract'.
    4. Do not explain. Return ONLY the keyword.
    
    Translation: "${textChunk}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const keyword = response.text ? response.text.trim() : null;
    
    if (!keyword) return null;

    // Remove any punctuation if the model hallucinates
    return keyword.replace(/[^a-zA-Z\s]/g, '');
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return null;
  }
};
