import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const resume = await readJson("resume.json");
const profile = await readJson("profiles/radical-minimal.json");
const projectEvidence = await readJson("data/project-evidence.json");
const qualifications = await readJson("data/qualifications.json");

function contactLine(basics) {
  return [basics.email, basics.phone, basics.url].filter(Boolean).join(" | ");
}

function header(basics) {
  return `# ${basics.name}, ${basics.label}`;
}

function skillsFor(names) {
  return resume.skills.filter((skill) => names.includes(skill.name));
}

function workFor(names) {
  return resume.work.filter((work) => names.includes(work.name));
}

function projectLine(project) {
  return `- [${project.title}](../${project.card}): ${project.summary}`;
}

function projectIndexLine(project) {
  return `- [${project.title}](${project.card.replace(/^projects\//, "")}) — ${project.summary}\n  - Capabilities: ${project.capabilities.join(", ")}`;
}

function portfolioIndexes() {
  return [
    "## PORTFOLIO INDEXES",
    "- [Recent Projects](../projects/index.md)",
    "- [Technologies, Tools, and Practices](../tech-tools/index.md)"
  ];
}

function qualificationLine(qualification) {
  return qualification.issuer
    ? `${qualification.name} — ${qualification.issuer}`
    : qualification.name;
}

function renderMinimal() {
  const selectedProjects = projectEvidence.filter((project) =>
    profile.selectedProjectIds.includes(project.id)
  );
  return [
    header(resume.basics),
    profile.headline,
    contactLine(resume.basics),
    "",
    "## SUMMARY",
    profile.minimalSummary,
    "",
    "## FOCUS",
    profile.focusLine,
    "",
    "## SELECTED EXPERIENCE",
    ...workFor(profile.selectedEmployers).flatMap((work) => [
      `**${work.name}** — ${work.position}`,
      ...work.highlights.map((highlight) => `- ${highlight}`)
    ]),
    "",
    "## PROJECT EVIDENCE",
    ...selectedProjects.map(projectLine),
    "",
    "## QUALIFICATIONS",
    qualifications.map(qualificationLine).join(" | "),
    "",
    ...portfolioIndexes(),
    "",
    `Full evidence portfolio: ${profile.portfolioUrl}`
  ].filter((line, index, lines) => line || lines[index - 1] !== "").join("\n");
}

function renderFull() {
  return [
    header(resume.basics),
    contactLine(resume.basics),
    "",
    "## SUMMARY",
    resume.basics.summary,
    "",
    "## EXPERIENCE",
    ...resume.work.flatMap((work) => [
      `**${work.name}** | ${work.position} | ${work.startDate ?? ""}-${work.endDate ?? "Present"}`,
      ...work.highlights.map((highlight) => `- ${highlight}`),
      ""
    ]),
    "",
    "## SKILLS",
    ...resume.skills.map((skill) => `- **${skill.name}:** ${skill.keywords.join(", ")}`),
    "",
    "## PROFESSIONAL QUALIFICATIONS",
    ...qualifications.map((qualification) => `- ${qualificationLine(qualification)}`),
    "",
    "## PROJECT EVIDENCE",
    ...projectEvidence.map(projectLine),
    "",
    ...portfolioIndexes()
  ].filter((line, index, lines) => line || lines[index - 1] !== "").join("\n");
}

function renderProjectIndex() {
  return [
    "# Recent Projects",
    "",
    "Recent public project evidence, maintained from `data/project-evidence.json`.",
    "",
    ...projectEvidence.map(projectIndexLine),
    ""
  ].join("\n");
}

await Promise.all([
  mkdir(new URL("dist/", root), { recursive: true }),
  mkdir(new URL("projects/", root), { recursive: true })
]);
await Promise.all([
  writeFile(new URL("dist/brian.perry.resume.brief.md", root), `${renderMinimal()}\n`),
  writeFile(new URL("dist/brian.perry.resume.full.md", root), `${renderFull()}\n`),
  writeFile(new URL("projects/index.md", root), renderProjectIndex())
]);
console.log("Generated Markdown resume drafts and project index.");
