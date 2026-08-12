import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = path.join(root, "tech-tools", "data", "inventory.json");
const maximumLength = 180;
const concurrency = 6;
const strict = process.argv.includes("--strict");

function decodeHtml(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizeDescription(value) {
  const text = decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
  if (text.length <= maximumLength) return text;
  const truncated = text.slice(0, maximumLength - 3);
  const wordBoundary = truncated.lastIndexOf(" ");
  return `${(wordBoundary > maximumLength / 2 ? truncated.slice(0, wordBoundary) : truncated).trim()}...`;
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match?.[2] ?? null;
}

function metadataDescription(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = attribute(tag, "name") ?? attribute(tag, "property");
    const content = attribute(tag, "content");
    if (name && content && /^(?:description|og:description|twitter:description)$/i.test(name)) {
      return normalizeDescription(content);
    }
  }
  return null;
}

function jsonLdDescription(html) {
  const scripts = html.match(/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>[\s\S]*?<\/script>/gi) ?? [];
  const descriptions = [];
  const collect = (value) => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") {
      if (typeof value.description === "string") descriptions.push(value.description);
      Object.values(value).forEach(collect);
    }
  };
  for (const script of scripts) {
    const content = script.replace(/^.*?>/, "").replace(/<\/script>$/i, "");
    try { collect(JSON.parse(content)); } catch { /* Ignore malformed structured data. */ }
  }
  return descriptions.map(normalizeDescription).find((description) => description.length > 20) ?? null;
}

function pageDescription(html) {
  const blocks = html.match(/<(?:main|article|p)\b[^>]*>[\s\S]*?<\/(?:main|article|p)>/gi) ?? [];
  const description = blocks
    .map(normalizeDescription)
    .find((candidate) => candidate.length >= 40 && !/^(?:cookie|subscribe|sign up|skip to)/i.test(candidate));
  if (description) return description;

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? normalizeDescription(title) : null;
}

async function fetchDescription(entry) {
  const response = await fetch(entry.reference, {
    headers: {
      accept: "text/html",
      connection: "close",
      "user-agent": "brian-perry-resume-description-updater/1.0"
    },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) throw new Error(`Expected HTML, received ${contentType || "an unknown content type"}`);
  const html = await response.text();
  const description = metadataDescription(html) ?? jsonLdDescription(html) ?? pageDescription(html);
  if (!description) throw new Error("No usable page description found");
  return description;
}

async function mapWithConcurrency(items, callback) {
  const results = [];
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await callback(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const referencedEntries = inventory.entries.filter((entry) => entry.reference);
const results = await mapWithConcurrency(referencedEntries, async (entry) => {
  try {
    return { entry, description: await fetchDescription(entry) };
  } catch (error) {
    return { entry, error: error.message };
  }
});

const failures = results.filter((result) => result.error);
const changed = results.some(({ entry, description }) => description && entry.definition !== description);
for (const { entry, description } of results) {
  if (description) entry.definition = description;
}

if (changed) {
  inventory.lastReviewed = new Date().toISOString().slice(0, 10);
  await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
}

console.log(`Updated ${results.length - failures.length} of ${results.length} reference descriptions.`);
if (failures.length) {
  for (const { entry, error } of failures) console.error(`${entry.name}: ${error}`);
}

await Promise.all([
  new Promise((resolve) => process.stdout.write("", resolve)),
  new Promise((resolve) => process.stderr.write("", resolve))
]);
process.exit(strict && failures.length ? 1 : 0);
