import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const outputFiles = [
  ["dist/brian.perry.resume.brief.md", "dist/brian.perry.resume.brief.html", "dist/brian.perry.resume.brief.pdf"],
  ["dist/brian.perry.resume.full.md", "dist/brian.perry.resume.full.html", "dist/brian.perry.resume.full.pdf"]
];

function parseMarkdown(markdown) {
  return markdown.replace(/\r\n/g, "\n").split("\n").filter(Boolean).map((line) => {
    if (line.startsWith("# ")) return { type: "title", text: line.slice(2) };
    if (line.startsWith("## ")) return { type: "heading", text: line.slice(3) };
    if (line.startsWith("- ")) return { type: "item", text: line.slice(2) };
    return { type: "paragraph", text: line };
  });
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatInline(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderHtml(blocks) {
  const content = blocks.map(({ type, text }) => {
    const inline = formatInline(text);
    if (type === "title") return `<h1>${inline}</h1>`;
    if (type === "heading") return `<h2>${inline}</h2>`;
    if (type === "item") return `<p class="item">- ${inline}</p>`;
    return `<p>${inline}</p>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${formatInline(blocks.find(({ type }) => type === "title")?.text ?? "Resume")}</title>
<style>
  @page { margin: 0.75in; }
  :root { color: #111; background: #fff; }
  body { max-width: 7.5in; margin: 0 auto; padding: 0.75in; font: 11pt/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  h1, h2, p { margin: 0; }
  h1 { margin-bottom: 0.1in; font-size: 18pt; line-height: 1.2; }
  h2 { margin-top: 0.25in; margin-bottom: 0.08in; font-size: 11pt; line-height: 1.2; }
  p { margin-bottom: 0.08in; }
  .item { padding-left: 0.18in; text-indent: -0.18in; }
  a { color: inherit; text-decoration: underline; text-underline-offset: 0.12em; }
  @media print { body { max-width: none; margin: 0; padding: 0; } }
</style>
</head>
<body>
${content}
</body>
</html>
`;
}

function pdfText(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/[\\()]/g, "\\$&");
}

function wrap(text, width) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (word.length > width) {
      if (line) lines.push(line);
      for (let index = 0; index < word.length; index += width) {
        lines.push(word.slice(index, index + width));
      }
      line = lines.pop();
    } else if (!line || line.length + word.length + 1 <= width) {
      line = line ? `${line} ${word}` : word;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function renderPdf(blocks) {
  const pages = [[]];
  let y = 738;

  function line(text, font, size, leading) {
    if (y - leading < 54) {
      pages.push([]);
      y = 738;
    }
    pages.at(-1).push(`BT /${font} ${size} Tf 54 ${y} Td (${pdfText(text)}) Tj ET`);
    y -= leading;
  }

  function employerLine(name, remainder, size, leading) {
    if (y - leading < 54) {
      pages.push([]);
      y = 738;
    }
    pages.at(-1).push(
      `BT /F2 ${size} Tf 54 ${y} Td (${pdfText(name)}) Tj /F1 ${size} Tf (${pdfText(remainder)}) Tj ET`
    );
    y -= leading;
  }

  for (const { type, text } of blocks) {
    const isTitle = type === "title";
    const isHeading = type === "heading";
    const isItem = type === "item";
    if (isHeading && pages.at(-1).length > 0) y -= 18;
    const size = isTitle ? 18 : isHeading ? 11 : 10;
    const leading = isTitle ? 24 : isHeading ? 18 : 14;
    const font = isTitle || isHeading ? "F2" : "F1";
    const prefix = isItem ? "- " : "";
    const width = isTitle ? 62 : 92;
    const employer = !isItem && text.match(/^\*\*([^*]+)\*\*((?:\s*[—|]).*)$/);
    const wrappedLines = employer
      ? wrap(`${employer[1]}${employer[2]}`, width)
      : wrap(`${prefix}${text}`, width);
    if (employer) {
      const [firstLine, ...remainingLines] = wrappedLines;
      employerLine(employer[1], firstLine.slice(employer[1].length), size, leading);
      for (const wrappedLine of remainingLines) {
        line(wrappedLine, font, size, leading);
      }
    } else for (const wrappedLine of wrappedLines) {
      line(wrappedLine, font, size, leading);
    }
    y -= isTitle ? 3 : isHeading ? 4 : 1;
  }

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
  ];
  const pageObjectNumbers = [];

  for (const page of pages) {
    const pageNumber = objects.length + 1;
    const contentNumber = pageNumber + 1;
    pageObjectNumbers.push(pageNumber);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNumber} 0 R >>`);
    const stream = page.join("\n");
    objects.push(`<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`);
  }
  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pages.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "ascii");
}

for (const [markdownFile, htmlFile, pdfFile] of outputFiles) {
  const markdown = await readFile(new URL(markdownFile, root), "utf8");
  const blocks = parseMarkdown(markdown);
  await Promise.all([
    writeFile(new URL(htmlFile, root), renderHtml(blocks)),
    writeFile(new URL(pdfFile, root), renderPdf(blocks))
  ]);
}

console.log("Generated HTML and PDF resume files.");
