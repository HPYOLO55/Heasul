import { logger } from "./logger";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NVIDIA_VISION_MODEL = "nvidia/llama-3.2-11b-vision-instruct";

const ANALYSIS_PROMPT = `You are a professional beauty and wellness coach. Analyze this photo and return ONLY valid JSON — no markdown, no explanation, just the raw JSON object.

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

export async function analyzeImageWithNvidia(base64Image: string): Promise<Record<string, unknown>> {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not configured. Please add your NVIDIA API key.");
  }

  // Strip the data URL prefix if present, keep the raw base64
  const imageData = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  // Reconstruct a proper data URL for the image_url field
  const dataUrl = `data:image/jpeg;base64,${imageData}`;

  const body = {
    model: NVIDIA_VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: ANALYSIS_PROMPT },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.2,
  };

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ status: response.status, error: errorText }, "NVIDIA API error");
    throw new Error(`NVIDIA API error: ${response.status} — ${errorText.slice(0, 200)}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Empty response from NVIDIA API");
  }

  // Strip any accidental markdown code fences
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    logger.error({ text }, "Failed to parse NVIDIA JSON response");
    throw new Error("Failed to parse NVIDIA analysis response");
  }
}

export function computeGlowScore(results: Record<string, unknown>): number {
  const score = results["overall_glow_score"];
  if (typeof score === "number") return score;
  return 70;
}
