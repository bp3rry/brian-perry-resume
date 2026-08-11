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

function skillsFor(names) {
  return resume.skills.filter((skill) => names.includes(skill.name));
}

function workFor(names) {
  return resume.work.filter((work) => names.includes(work.name));
}

function projectLine(project) {
  return `- [${project.title}](../${project.card}): ${project.summary}`;
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
    `# ${resume.basics.name}`,
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
    `Full evidence portfolio: ${profile.portfolioUrl}`
  ].filter((line, index, lines) => line || lines[index - 1] !== "").join("\n");
}

function renderFull() {
  return [
    `# ${resume.basics.name}`,
    resume.basics.label,
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
    ...resume.skills.map((skill) => `**${skill.name}:** ${skill.keywords.join(", ")}`),
    "",
    "## CERTIFICATES",
    ...resume.certificates.map((certificate) => `- ${certificate.name} | ${certificate.issuer}`),
    "",
    "## PROFESSIONAL QUALIFICATIONS",
    ...qualifications.map((qualification) => `- ${qualificationLine(qualification)}`),
    "",
    "## PROJECT EVIDENCE",
    ...projectEvidence.map(projectLine)
  ].filter((line, index, lines) => line || lines[index - 1] !== "").join("\n");
}

await mkdir(new URL("dist/", root), { recursive: true });
await Promise.all([
  writeFile(new URL("dist/radical-minimal.md", root), `${renderMinimal()}\n`),
  writeFile(new URL("dist/full-resume.md", root), `${renderFull()}\n`)
]);
console.log("Generated Markdown resume drafts.");
