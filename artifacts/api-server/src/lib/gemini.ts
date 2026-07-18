import { logger } from "./logger";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";

const GEMINI_PROMPT = `You are a professional beauty and wellness coach. Analyze this photo and return ONLY valid JSON with this exact structure. Do not diagnose medical conditions. Provide grooming, skincare, hairstyle, style, posture, and wellness guidance only.

{
  "overall_glow_score": <number 0-100>,
  "skin_analysis": {
    "condition": "<brief description>",
    "tips": "<actionable tip>",
    "estimated_time": "<e.g. 2-4 weeks>",
    "difficulty": "<Easy|Medium|Hard>",
    "priority": "<High|Medium|Low>",
    "score": <number 0-100>
  },
  "hair_analysis": {
    "condition": "<brief description>",
    "tips": "<actionable tip>",
    "estimated_time": "<timeframe>",
    "difficulty": "<Easy|Medium|Hard>",
    "priority": "<High|Medium|Low>",
    "score": <number 0-100>
  },
  "eyes_analysis": {
    "condition": "<brief description>",
    "tips": "<actionable tip>",
    "estimated_time": "<timeframe>",
    "difficulty": "<Easy|Medium|Hard>",
    "priority": "<High|Medium|Low>",
    "score": <number 0-100>
  },
  "smile_analysis": {
    "condition": "<brief description>",
    "tips": "<actionable tip>",
    "estimated_time": "<timeframe>",
    "difficulty": "<Easy|Medium|Hard>",
    "priority": "<High|Medium|Low>",
    "score": <number 0-100>
  },
  "face_shape": {
    "condition": "<shape + description>",
    "tips": "<styling tip for this face shape>",
    "estimated_time": "<timeframe>",
    "difficulty": "<Easy|Medium|Hard>",
    "priority": "<High|Medium|Low>",
    "score": <number 0-100>
  },
  "posture": {
    "condition": "<brief description>",
    "tips": "<actionable tip>",
    "estimated_time": "<timeframe>",
    "difficulty": "<Easy|Medium|Hard>",
    "priority": "<High|Medium|Low>",
    "score": <number 0-100>
  },
  "outfit": {
    "condition": "<brief description>",
    "tips": "<styling tip>",
    "estimated_time": "<timeframe>",
    "difficulty": "<Easy|Medium|Hard>",
    "priority": "<High|Medium|Low>",
    "score": <number 0-100>
  },
  "lifestyle": {
    "condition": "<impression from appearance>",
    "tips": "<wellness tip>",
    "estimated_time": "<timeframe>",
    "difficulty": "<Easy|Medium|Hard>",
    "priority": "<High|Medium|Low>",
    "score": <number 0-100>
  },
  "style_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "top_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "top_weaknesses": ["<area to improve 1>", "<area to improve 2>", "<area to improve 3>"],
  "morning_routine": ["<step 1>", "<step 2>", "<step 3>", "<step 4>", "<step 5>"],
  "evening_routine": ["<step 1>", "<step 2>", "<step 3>", "<step 4>"],
  "weekly_routine": ["<weekly habit 1>", "<weekly habit 2>", "<weekly habit 3>"],
  "recommended_habits": ["<habit 1>", "<habit 2>", "<habit 3>"],
  "priority_improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`;

export async function analyzeImageWithGemini(base64Image: string): Promise<Record<string, unknown>> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Please add your Gemini API key.");
  }

  // Strip the data URL prefix if present
  const imageData = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          { text: GEMINI_PROMPT },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageData,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 4096,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ status: response.status, error: errorText }, "Gemini API error");
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Gemini API");
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    logger.error({ text }, "Failed to parse Gemini JSON response");
    throw new Error("Failed to parse Gemini analysis response");
  }
}

export function computeGlowScore(results: Record<string, unknown>): number {
  const score = results["overall_glow_score"];
  if (typeof score === "number") return score;
  return 70;
}
