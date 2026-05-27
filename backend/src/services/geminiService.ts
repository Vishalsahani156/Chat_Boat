import { GoogleGenerativeAI } from "@google/generative-ai";
import { MessageHistory } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const SYSTEM_PROMPT =
  "You are a helpful AI assistant. Be concise and accurate. Keep responses brief unless asked for detail.";

export const generateResponse = async (
  message: string,
  history: MessageHistory[]
): Promise<string> => {
  try {
    const recentHistory = history.slice(-10);

    const contextLines = recentHistory.map(
      (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
    );

    const prompt = [
      SYSTEM_PROMPT,
      ...(contextLines.length > 0
        ? ["", "Previous conversation:", ...contextLines, ""]
        : [""]),
      `User: ${message}`,
      "Assistant:",
    ].join("\n");

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    if (!response) {
      throw new Error("Empty response from Gemini");
    }

    return response;
  } catch (error) {
    console.error("Gemini API error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Invalid Gemini API key. Please check your configuration.");
      }
      if (error.message.includes("quota") || error.message.includes("rate")) {
        throw new Error("API rate limit exceeded. Please try again later.");
      }
    }

    throw new Error("Failed to generate AI response. Please try again.");
  }
};
