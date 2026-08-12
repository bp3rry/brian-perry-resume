import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wiki = path.join(root, 'tech-tools');
const inventoryPath = path.join(wiki, 'data', 'inventory.json');
const check = process.argv.includes('--check');

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const slugify = (name) => name.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const relative = (from, to) => path.relative(from, to).split(path.sep).join('/');
const external = (url, label = 'Official reference') => `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;

function validate(inventory) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inventory.lastReviewed)) throw new Error('lastReviewed must be ISO date.');
  const categories = new Set(inventory.categories.map(({ path: category }) => category));
  const locations = new Set();
  const names = new Set();
  for (const entry of inventory.entries) {
    if (!entry.name || !entry.definition || !categories.has(entry.category)) throw new Error(`Invalid inventory entry: ${entry.name ?? '<unnamed>'}`);
    if (entry.definition.includes('\n')) throw new Error(`Definition must be one line: ${entry.name}`);
    const location = `${entry.category}/${slugify(entry.name)}`;
    if (locations.has(location)) throw new Error(`Duplicate page location: ${location}`);
    if (names.has(entry.name)) throw new Error(`Duplicate entry name: ${entry.name}`);
    if (entry.reference && !/^https:\/\//.test(entry.reference)) throw new Error(`Reference must be an HTTPS URL: ${entry.name}`);
    if (entry.descriptionReference && !/^https:\/\//.test(entry.descriptionReference)) throw new Error(`Description reference must be an HTTPS URL: ${entry.name}`);
    locations.add(location); names.add(entry.name);
  }
}

function renderPage(entry, inventory) {
  const location = path.join(wiki, entry.category, `${slugify(entry.name)}.html`);
  const directory = path.dirname(location);
  const backToIndex = relative(directory, path.join(wiki, 'index.html'));
  const styles = relative(directory, path.join(wiki, 'styles.css'));
  const markdown = [
    `# ${entry.name}`,
    '',
    entry.definition,
    ...(entry.reference ? ['', '## Reference', '', `[Official reference](${entry.reference})`] : []),
    ...(entry.evidence ? ['', '## Public Evidence', '', `- [${entry.evidence.label}](${entry.evidence.url})`] : []),
    '',
    `Last reviewed: ${inventory.lastReviewed}`,
    ''
  ].join('\n');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(entry.name)} | Brian Perry</title>
<link rel="stylesheet" href="${escapeHtml(styles)}">
</head>
<body>
<p><a href="${escapeHtml(backToIndex)}">Technology and Tools</a></p>
<h1>${escapeHtml(entry.name)}</h1>
<p>${escapeHtml(entry.definition)}</p>${entry.reference ? `
<h2>Reference</h2>
<p>${external(entry.reference)}</p>` : ''}${entry.evidence ? `
<h2>Public Evidence</h2>
<p class="item">- <a href="${escapeHtml(entry.evidence.url)}">${escapeHtml(entry.evidence.label)}</a></p>` : ''}
<p>Last reviewed: ${inventory.lastReviewed}</p>
</body>
</html>
`;
  return [{ file: path.join(wiki, entry.category, `${slugify(entry.name)}.md`), content: markdown }, { file: location, content: html }];
}

function renderIndex(inventory) {
  const categoryEntries = new Map(inventory.categories.map((category) => [category.path, []]));
  for (const entry of inventory.entries) categoryEntries.get(entry.category).push(entry);
  for (const entries of categoryEntries.values()) entries.sort((a, b) => a.name.localeCompare(b.name));
  const md = ['# Technology and Tools', '', 'A categorized directory of technologies, tools, and practices documented in recent project work.', '', 'Listed entries document recent hands-on use from an AI-generated scan of project artifacts; they do not represent expertise or proficiency ratings.', ''];
  const html = ['<!doctype html>', '<html lang="en">', '<head>', '<meta charset="utf-8">', '<meta name="viewport" content="width=device-width, initial-scale=1">', '<title>Technology and Tools | Brian Perry</title>', '<link rel="stylesheet" href="styles.css">', '</head>', '<body>', '<h1>Technology and Tools</h1>', '<p>A categorized directory of technologies, tools, and practices documented in recent project work.</p>', '<p>Listed entries document recent hands-on use from an AI-generated scan of project artifacts; they do not represent expertise or proficiency ratings.</p>'];
  for (const category of inventory.categories) {
    const entries = categoryEntries.get(category.path);
    md.push(`## ${category.title}`, '');
    html.push(`<h2>${escapeHtml(category.title)}</h2>`);
    for (const entry of entries) {
      const filename = `${slugify(entry.name)}.md`;
      md.push(`- [${entry.name}](${category.path}/${filename}) - ${entry.definition}`);
      html.push(`<p class="item">- <a href="${category.path}/${slugify(entry.name)}.html">${escapeHtml(entry.name)}</a> - ${escapeHtml(entry.definition)}</p>`);
    }
    md.push('');
  }
  html.push('</body>', '</html>', '');
  return [{ file: path.join(wiki, 'index.md'), content: md.join('\n') }, { file: path.join(wiki, 'index.html'), content: html.join('\n') }];
}

async function expectedFiles(inventory) {
  return [...renderIndex(inventory), ...inventory.entries.flatMap((entry) => renderPage(entry, inventory))];
}

async function checkGenerated(files) {
  let errors = [];
  for (const { file, content } of files) {
    try { if (await readFile(file, 'utf8') !== content) errors.push(path.relative(root, file)); }
    catch { errors.push(path.relative(root, file)); }
  }
  for (const folder of ['tools', 'technologies', 'practices']) {
    try {
      const paths = await allFiles(path.join(wiki, folder));
      const expected = new Set(files.map(({ file }) => file));
      errors.push(...paths.filter((file) => !expected.has(file)).map((file) => path.relative(root, file)));
    } catch { /* no generated files is reported above */ }
  }
  if (errors.length) throw new Error(`Generated files are stale or unexpected:\n${errors.sort().join('\n')}`);
  const brokenLinks = [];
  for (const { file, content } of files.filter(({ file }) => file.endsWith('.html'))) {
    for (const match of content.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (/^(?:https?:|#)/.test(href)) continue;
      try { await readFile(path.resolve(path.dirname(file), href)); }
      catch { brokenLinks.push(`${path.relative(root, file)} -> ${href}`); }
    }
  }
  if (brokenLinks.length) throw new Error(`Broken local links:\n${brokenLinks.join('\n')}`);
}

async function allFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => entry.isDirectory() ? allFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}

async function generate(files) {
  await Promise.all(['tools', 'technologies', 'practices'].map((folder) => rm(path.join(wiki, folder), { recursive: true, force: true })));
  for (const { file, content } of files) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
}

const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
validate(inventory);
const files = await expectedFiles(inventory);
if (check) await checkGenerated(files); else await generate(files);
console.log(`${check ? 'Validated' : 'Generated'} ${inventory.entries.length} technology and practice pages.`);
