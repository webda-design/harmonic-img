import { GoogleGenerativeAI } from "@google/generative-ai";

const BACKGROUND_PRESETS = {
  nordic: {
    label: "北欧風リビング",
    prompt: "Scandinavian living room, light oak wood floors, white walls, natural linen textiles, minimalist furniture, large windows with soft natural light, indoor plants, cozy warm atmosphere, professional interior photography",
  },
  natural: {
    label: "ナチュラル系",
    prompt: "natural Japanese style interior, warm wood tones, washi paper textures, soft neutral colors, bamboo accents, zen minimalist aesthetic, diffused soft lighting, professional interior photography",
  },
  modern: {
    label: "モダン・シック",
    prompt: "modern luxury interior, dark charcoal walls, polished concrete floors, designer lighting fixtures, monochromatic palette with brass accents, sophisticated urban aesthetic, professional interior photography",
  },
  cafe: {
    label: "カフェスタイル",
    prompt: "cozy cafe interior background, exposed brick wall, warm Edison bulb lighting, reclaimed wood shelves, greenery, vintage industrial style, soft bokeh background, professional photography",
  },
  outdoor: {
    label: "テラス・屋外",
    prompt: "modern outdoor terrace, wooden deck, lush garden greenery, natural daylight, fresh open air atmosphere, landscape in background, professional outdoor furniture photography",
  },
  white_studio: {
    label: "ホワイトスタジオ",
    prompt: "clean white studio background, soft even lighting, subtle shadow, pure white seamless backdrop, professional product photography studio",
  },
};

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64, mimeType, backgroundKey } = req.body;
  if (!imageBase64 || !backgroundKey) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const preset = BACKGROUND_PRESETS[backgroundKey];
  if (!preset) return res.status(400).json({ error: "Invalid background key" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-preview-image-generation",
    });

    const prompt = `You are a professional product photographer and image editor.

TASK: Replace ONLY the background of the furniture/product in this image with a new background scene. 

CRITICAL RULES - you MUST follow all of these:
1. PRESERVE the exact shape, form, legs, handles, color, texture, and material of the furniture/product
2. Do NOT change any part of the product itself - no modifications to design details
3. Keep the product in the same position and scale
4. Match lighting direction naturally with the new background
5. Ensure realistic perspective and proportions between furniture and background
6. BACKGROUND STYLE: ${preset.prompt}

Output a high-quality, photorealistic image with the product seamlessly integrated into the new background.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imageBase64,
        },
      },
    ]);

    const response = result.response;
    const parts = response.candidates[0].content.parts;

    // 画像パートを探す
    const imagePart = parts.find((p) => p.inlineData);
    if (!imagePart) {
      // テキストのみ返ってきた場合
      const textPart = parts.find((p) => p.text);
      return res.status(500).json({
        error: "画像生成に失敗しました。モデルがテキストのみ返しました。",
        detail: textPart?.text || "",
      });
    }

    return res.status(200).json({
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    });
  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(500).json({ error: err.message || "Generation failed" });
  }
}
