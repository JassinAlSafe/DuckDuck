import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const getDuckCommentary = async (score: number): Promise<string> => {
  if (!genAI) {
    return getFallbackCommentary(score);
  }

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a sarcastic, 8-bit duck character from a retro video game.
      The player just lost the game.
      Their score was: ${score}.
      Give them a witty, slightly roast-y, or funny one-sentence comment about their performance.
      Keep it under 15 words.
      Do not use emojis.
    `;

    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || getFallbackCommentary(score);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return getFallbackCommentary(score);
  }
};

const getFallbackCommentary = (score: number): string => {
  if (score < 500) return "Try using the jump button next time.";
  if (score < 1000) return "Not bad for a rookie.";
  return "That was actually pretty good!";
};
