#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data", "programs.json");
const readmePath = path.join(root, "README.md");
const checkOnly = process.argv.includes("--check");

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const categories = [
  { key: "students", heading: "Students" },
  { key: "open_source", heading: "Open Source" },
  { key: "startups", heading: "Startups" },
  { key: "ai_developer_credits", heading: "AI and Developer Credits" },
  { key: "ambassadors", heading: "Ambassadors" },
];

const statusLabels = {
  active: "Active",
  paused: "Paused",
  expired: "Expired",
};

const escapeCell = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
const displayStatus = (status) => statusLabels[status] ?? status;
const displayBenefit = (program) => program.benefits.map((benefit) => escapeCell(benefit.label)).join("<br />");
const displayUrl = (program) => program.application_url ?? program.official_url;

const lines = [
  "# Awesome Builder Programs",
  "",
  '[![Awesome](https://awesome.re/badge.svg)](https://awesome.re) <a href="https://github.com/doanbactam/awesome-builder-programs"><img src="https://img.shields.io/github/stars/doanbactam/awesome-builder-programs?style=flat" alt="Stars" /></a>',
  "",
  "A curated list of programs that provide credits, grants, or tools for people building things.",
  "",
  "Includes programs for:",
  "",
  "- students",
  "- startups",
  "- open-source maintainers",
  "- independent developers",
  "",
  "Only official program pages are listed.",
  "",
  "Program availability and benefits can change. Verify the provider page before applying.",
  "",
  "The canonical structured dataset is [data/programs.json](data/programs.json).",
  "",
  "---",
  "",
  "## Contents",
  "",
  ...categories.map(({ heading }) => {
    const anchor = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return "* [" + heading + "](#" + anchor + ")";
  }),
  "* [Data quality](#data-quality)",
  "* [Contributing](#contributing)",
  "",
  "---",
  "",
];

for (const { key, heading } of categories) {
  const programs = data.programs
    .filter((program) => program.categories.includes(key))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));

  lines.push("## " + heading, "", "| Program | Provider | Benefit | Status | Verified |", "|---|---|---|---|---|");
  for (const program of programs) {
    lines.push(
      "| [" + escapeCell(program.name) + "](" + displayUrl(program) + ") | " +
      escapeCell(program.provider) + " | " + displayBenefit(program) + " | " +
      displayStatus(program.status) + " | " + (program.last_verified_at ?? "—") + " |",
    );
  }
  lines.push("", "---", "");
}

lines.push(
  "## Data quality",
  "",
  "- **Active** means an official source confirms availability and the record was verified within the last 30 days.",
  "- **Paused** and **Expired** records are retained for provenance but are not active opportunities.",
  "- Unverified records (`needs_review` or `unknown`) are staging-only and are excluded from data/programs.json and this README.",
  "- A successful link check does not by itself prove that a program is accepting applications.",
  "",
  "See [DATA.md](DATA.md) for the schema and verification policy.",
  "",
  "---",
  "",
  "## Contributing",
  "",
  "Contributions are welcome! Edit [data/programs.json](data/programs.json) rather than editing this README directly.",
  "",
  "Before opening a pull request:",
  "",
  "- Link to the official program page",
  "- Verify the current benefit, eligibility, and status before adding the record; leave it out if the evidence is insufficient",
  "- Make sure the current status and benefit are supported by the source",
  "- Note geographic, school, funding, or age eligibility limits when they apply",
  "- Add last_verified_at and verification notes for active records",
  "- Avoid affiliate or referral links",
  "- Run node scripts/validate-programs.mjs",
  "- Run node scripts/generate-readme.mjs",
  "",
  "Submit a pull request with a short explanation of the change.",
  "",
  "---",
  "",
  "## Star History",
  "",
  "[![Star History Chart](https://api.star-history.com/image?repos=doanbactam/awesome-builder-programs&type=date&legend=top-left)](https://www.star-history.com/?repos=doanbactam%2Fawesome-builder-programs&type=date&legend=top-left)",
  "",
);

const generated = lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";

if (checkOnly) {
  const current = fs.readFileSync(readmePath, "utf8");
  if (current !== generated) {
    console.error("README.md is out of date. Run: node scripts/generate-readme.mjs");
    process.exit(1);
  }
  console.log("README.md matches data/programs.json.");
} else {
  fs.writeFileSync(readmePath, generated);
  console.log("Generated README.md from data/programs.json.");
}
