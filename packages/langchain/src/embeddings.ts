import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

/**
 * Create Google Generative AI embeddings instance
 * Uses text-embedding-004 model which produces 768-dimensional embeddings
 */
export const createGoogleEmbeddings = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  return new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004", // 768 dimensions
    apiKey: process.env.GEMINI_API_KEY,
  });
};

export { GoogleGenerativeAIEmbeddings };
