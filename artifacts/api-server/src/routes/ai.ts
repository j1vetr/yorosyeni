import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { db } from "../lib/db";
import { settingsTable } from "@workspace/db/schema";

const router = Router();

router.post("/ai/generate", requireAuth, async (req, res): Promise<void> => {
  const { productName, category, languages } = req.body as {
    productName: string;
    category?: string;
    languages?: string[];
  };

  const [settings] = await db.select().from(settingsTable).limit(1);
  const apiKey = settings?.openAiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    res.status(400).json({ error: "OpenAI API key not configured in settings" });
    return;
  }

  const targetLangs = languages?.length ? languages : ["tr", "en", "ru", "ar"];
  const langNames: Record<string, string> = {
    tr: "Turkish",
    en: "English",
    ru: "Russian",
    ar: "Arabic",
  };

  const prompt = `You are a professional restaurant menu copywriter.
Generate a concise, appetizing menu description for the following item:
Product: "${productName}"${category ? `\nCategory: "${category}"` : ""}

Respond ONLY with a valid JSON object like:
{
  "translations": {
    ${targetLangs.map((l) => `"${l}": { "name": "...", "description": "..." }`).join(",\n    ")}
  }
}

Rules:
- Keep descriptions under 80 words
- Be sensory and appealing
- Use natural language for each target language: ${targetLangs.map((l) => langNames[l] || l).join(", ")}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(502).json({ error: "OpenAI error", detail: err });
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: "AI generation failed", detail: String(err) });
  }
});

export default router;
