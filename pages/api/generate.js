import { GoogleGenAI, Modality } from "@google/genai";

const BACKGROUND_PRESETS = {
  nordic: {
    label: "北欧風リビング",
    prompt: "Scandinavian living room background, light oak wood floor, white walls, natural linen sofa, minimalist wooden furniture, large window with soft diffused natural daylight, a few indoor plants, warm cozy atmosphere, professional interior photography style",
  },
  natural: {
    label: "ナチュラル系",
    prompt: "Japanese natural style interior background, warm wood tones, neutral beige walls, washi paper shoji screen, tatami-inspired elements, zen minimalist calm atmosphere, soft diffused lighting, professional interior photography",
  },
  modern: {
    label: "モダン・シック",
    prompt: "modern luxury interior background, deep charcoal gray walls, polished concrete floor, subtle brass accent lamp, monochromatic sophisticated urban aesthetic, professional architectural interior photography",
  },
  cafe: {
    label: "カフェスタイル",
    prompt: "cozy cafe interior background, warm exposed brick wall, Edison bulb pendant lights, reclaimed wood shelf with plants, vintage industrial style, warm bokeh soft focus background, professional lifestyle photography",
  },
  outdoor: {
    label: "テラス・屋外",
    prompt: "modern wooden outdoor terrace background, lush green garden, natural bright daylight, fresh open air, subtle landscape in soft focus, professional outdoor furniture photography",
  },
  white_studio: {
    label: "ホワイトスタジオ",
    prompt: "clean white seamless studio background, soft even professional lighting, subtle floor shadow, pure white backdrop, professional product photography studio setting",
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
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a professional product photographer and retoucher specializing in furniture and interior design.

TASK: Edit this furniture/product image by replacing ONLY the background with a new scene.

STEP 1 — ANALYZE the original image carefully before generating:
- Identify the camera angle and viewpoint (e.g. slightly above, eye-level, low angle)
- Identify the camera height relative to the product
- Identify the vanishing point and perspective lines of the product
- Identify the direction, color temperature, and intensity of the light source

STEP 2 — GENERATE with the following STRICT RULES (follow all without exception):
1. PRESERVE the exact shape, silhouette, legs, handles, joints, and all structural details of the furniture/product
2. PRESERVE the exact color, material texture, finish, and surface appearance of the product
3. Keep the product in the same position, scale, and perspective — do NOT distort or warp the product
4. CRITICAL — PERSPECTIVE MATCH: The background scene MUST be rendered from the EXACT SAME camera angle, height, and viewpoint as the original product photo. If the product is shot slightly from above, the background floor/room must also recede from that same elevated viewpoint. The vanishing lines of the background must align with those of the product.
5. CRITICAL — LIGHTING MATCH: The light source direction, intensity, and color temperature in the background must match the lighting on the product exactly.
6. Ensure realistic depth and proportions — the product must look naturally placed in the scene, not floating or pasted.
7. Do NOT add any new objects, decorations, or items that were not in the original image
8. The final image must look like a single professional product lifestyle photograph taken in one shot

NEW BACKGROUND SCENE: ${preset.prompt}

Output a single photorealistic composite image where the product seamlessly fits into the new background with perfectly matched perspective and lighting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const parts = response.candidates[0].content.parts;
    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart) {
      const textPart = parts.find((p) => p.text);
      return res.status(500).json({
        error: "画像が生成されませんでした。",
        detail: textPart?.text || "モデルからの応答に画像が含まれていません",
      });
    }

    return res.status(200).json({
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || "image/png",
    });
  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(500).json({ error: err.message || "Generation failed" });
  }
}
