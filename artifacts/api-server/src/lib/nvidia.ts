import { logger } from "./logger";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NVIDIA_VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl";

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

const HAIRSTYLE_PROMPT = `You are a professional hairstylist and grooming expert. Analyze the visible facial features and current hairstyle in this photo. Provide hairstyle suggestions only. Do not diagnose medical conditions or make any comments about attractiveness or health.

Return ONLY valid JSON — no markdown, no explanation, just the raw JSON object:

{
  "face_shape": "",
  "current_hairstyle": "",
  "hair_length": "",
  "hair_texture": "",
  "recommended_styles": [
    {
      "name": "",
      "why_it_matches": "",
      "maintenance": "Low | Medium | High",
      "styling_difficulty": "Easy | Moderate | Hard"
    }
  ],
  "recommended_hair_lengths": [],
  "recommended_parting": "",
  "recommended_beard_style": "",
  "haircare_tips": [],
  "styling_products": [],
  "confidence": ""
}`;

export async function analyzeHairstyleWithNvidia(base64Image: string): Promise<Record<string, unknown>> {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not configured.");
  }

  const imageData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
  const dataUrl = `data:image/jpeg;base64,${imageData}`;

  const body = {
    model: NVIDIA_VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: HAIRSTYLE_PROMPT },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    max_tokens: 2048,
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
    logger.error({ status: response.status, error: errorText }, "NVIDIA hairstyle API error");
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from NVIDIA API");

  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    logger.error({ text }, "Failed to parse NVIDIA hairstyle JSON response");
    throw new Error("Failed to parse hairstyle analysis response");
  }
}

const CLOTHING_PROMPT = `You are a professional fashion stylist. Analyze this clothing item. Return ONLY valid JSON — no markdown, no explanation, just the raw JSON object:

{
  "name": "",
  "category": "",
  "subcategory": "",
  "primary_color": "",
  "secondary_colors": [],
  "pattern": "",
  "material": "",
  "season": "",
  "occasion": "",
  "style": "",
  "fit": "",
  "gender": "",
  "formality": "",
  "description": "",
  "confidence": ""
}

Do not identify brands unless clearly visible. Do not invent details. Return only information supported by the image.`;

export async function analyzeClothingWithNvidia(base64Image: string): Promise<Record<string, unknown>> {
  if (!NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is not configured.");

  const imageData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
  const dataUrl = `data:image/jpeg;base64,${imageData}`;

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${NVIDIA_API_KEY}` },
    body: JSON.stringify({
      model: NVIDIA_VISION_MODEL,
      messages: [{ role: "user", content: [
        { type: "text", text: CLOTHING_PROMPT },
        { type: "image_url", image_url: { url: dataUrl } },
      ]}],
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    logger.error({ status: response.status, err }, "NVIDIA clothing API error");
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from NVIDIA API");

  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    logger.error({ text }, "Failed to parse NVIDIA clothing JSON");
    throw new Error("Failed to parse clothing analysis response");
  }
}

export async function generateOutfitWithNvidia(
  items: Record<string, unknown>[],
  occasion: string,
  weather?: string,
  preferredColors?: string[]
): Promise<Record<string, unknown>> {
  if (!NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is not configured.");

  const wardrobeStr = items.map(i =>
    `ID:${i.id} | ${i.name} | Category:${i.category} | Color:${i.primaryColor} | Season:${i.season} | Occasion:${i.occasion} | Formality:${i.formality} | Style:${i.style}`
  ).join("\n");

  const prompt = `You are a professional fashion stylist. The user wants an outfit for: ${occasion}${weather ? `, Weather: ${weather}` : ""}${preferredColors?.length ? `, Preferred colors: ${preferredColors.join(", ")}` : ""}.

Here is their wardrobe (use ONLY items from this list by their ID):
${wardrobeStr}

Create a complete outfit. Return ONLY valid JSON — no markdown, no extra text:

{
  "top": { "id": <number or null>, "name": "", "reason": "" },
  "bottom": { "id": <number or null>, "name": "", "reason": "" },
  "shoes": { "id": <number or null>, "name": "", "reason": "" },
  "accessory": { "id": <number or null>, "name": "", "reason": "" },
  "style_score": <number 0-100>,
  "color_harmony": "",
  "occasion": "${occasion}",
  "why_it_works": "",
  "styling_tip": ""
}

Only use item IDs from the wardrobe list above. Set id to null if no suitable item exists in that category.`;

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${NVIDIA_API_KEY}` },
    body: JSON.stringify({
      model: NVIDIA_VISION_MODEL,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      max_tokens: 1024,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    logger.error({ status: response.status, err }, "NVIDIA outfit API error");
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from NVIDIA API");

  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    logger.error({ text }, "Failed to parse NVIDIA outfit JSON");
    throw new Error("Failed to parse outfit generation response");
  }
}

export function computeGlowScore(results: Record<string, unknown>): number {
  const score = results["overall_glow_score"];
  if (typeof score === "number") return score;
  return 70;
}
