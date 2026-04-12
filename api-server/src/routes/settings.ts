import { Router } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { logger } from "../lib/logger";

const router = Router();

const CONFIG_DIR = join(process.cwd(), "config");
const CONFIG_FILE = join(CONFIG_DIR, "api-keys.json");

export const KNOWN_KEYS: Array<{ key: string; label: string; category: string; required: boolean }> = [
  { key: "SERPER_API_KEY",    label: "Serper — Google Search",        category: "search",  required: true  },
  { key: "TAVILY_API_KEY",    label: "Tavily — AI Web Search",        category: "search",  required: false },
  { key: "EXA_API_KEY",       label: "Exa — Neural/Keyword Search",   category: "search",  required: false },
  { key: "BRAVE_API_KEY",     label: "Brave — Independent Index (2K/mo free)", category: "search", required: false },
  { key: "JINA_API_KEY",      label: "Jina — Page Reader (200RPM free)", category: "crawl", required: false },
  { key: "FIRECRAWL_API_KEY", label: "Firecrawl — Advanced Crawling", category: "crawl",  required: false },
  { key: "GROQ_API_KEY",      label: "Groq — AI Extraction (Fast)",   category: "ai",     required: true  },
  { key: "OPENROUTER_KEY",    label: "OpenRouter — AI Fallback",      category: "ai",     required: false },
];

export function readConfig(): Record<string, string> {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeConfig(config: Record<string, string>) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function maskKey(value: string): string {
  if (value.length === 0) return "";
  if (value.length <= 8) return "•".repeat(value.length);
  return value.slice(0, 4) + "•".repeat(Math.min(12, value.length - 7)) + value.slice(-3);
}

// GET /api/settings/api-keys
router.get("/settings/api-keys", (_req, res) => {
  const config = readConfig();
  const result: Record<string, { set: boolean; masked: string; label: string; category: string; required: boolean }> = {};

  for (const { key, label, category, required } of KNOWN_KEYS) {
    const value = config[key] || process.env[key] || "";
    result[key] = {
      set: value.length > 0,
      masked: maskKey(value),
      label,
      category,
      required,
    };
  }

  res.json(result);
});

// POST /api/settings/api-keys  { key, value }
router.post("/settings/api-keys", (req, res) => {
  const { key, value } = req.body as { key?: string; value?: string };
  const validKeys = KNOWN_KEYS.map((k) => k.key);

  if (!key || !validKeys.includes(key)) {
    res.status(400).json({ error: "Unknown key" });
    return;
  }

  const config = readConfig();
  const trimmed = (value ?? "").trim();

  if (trimmed === "") {
    delete config[key];
    delete process.env[key];
  } else {
    config[key] = trimmed;
    // Apply immediately so current process uses it without restart
    process.env[key] = trimmed;
  }

  writeConfig(config);
  logger.info({ key }, "API key updated via settings UI");

  res.json({ success: true, set: trimmed.length > 0 });
});

// DELETE /api/settings/api-keys/:key
router.delete("/settings/api-keys/:key", (req, res) => {
  const { key } = req.params;
  const validKeys = KNOWN_KEYS.map((k) => k.key);

  if (!validKeys.includes(key)) {
    res.status(400).json({ error: "Unknown key" });
    return;
  }

  const config = readConfig();
  delete config[key];
  delete process.env[key];
  writeConfig(config);

  logger.info({ key }, "API key removed via settings UI");
  res.json({ success: true });
});

export default router;
