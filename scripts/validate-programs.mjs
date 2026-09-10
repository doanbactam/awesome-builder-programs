#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data", "programs.json");

const allowedStatuses = new Set(["active", "needs_review", "paused", "expired", "unknown"]);
const allowedApplicationStates = new Set(["open", "rolling", "invite_only", "closed", "unknown"]);
const allowedCategories = new Set(["students", "open_source", "startups", "ai_developer_credits", "ambassadors"]);
const allowedVerificationMethods = new Set([
  "readme_import",
  "official_page",
  "provider_confirmation",
  "manual_review",
  "automated_check",
]);

const errors = [];
const error = (message) => errors.push(message);
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

function isHttpUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function ageInDays(date) {
  const then = Date.parse(date + "T00:00:00Z");
  return Math.floor((Date.now() - then) / 86_400_000);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
} catch (cause) {
  console.error("Unable to read " + path.relative(root, dataPath) + ": " + cause.message);
  process.exit(1);
}

if (!isRecord(data)) error("Root value must be an object.");
if (!isNonEmptyString(data?.$schema)) error("$schema must point to the data schema.");
if (data?.schema_version !== 1) error("schema_version must be 1.");
if (!Array.isArray(data?.programs) || data.programs.length === 0) {
  error("programs must be a non-empty array.");
}

const slugs = new Set();
const identities = new Set();

for (const [index, program] of (data?.programs ?? []).entries()) {
  const label = "programs[" + index + "]";

  if (!isRecord(program)) {
    error(label + " must be an object.");
    continue;
  }

  for (const field of ["slug", "name", "provider", "status", "application_state", "verification_method", "verification_notes"]) {
    if (!isNonEmptyString(program[field])) error(label + "." + field + " must be a non-empty string.");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(program.slug ?? "")) {
    error(label + ".slug must be kebab-case.");
  }
  if (slugs.has(program.slug)) error(label + ".slug is duplicated: " + program.slug);
  slugs.add(program.slug);

  const identity = String(program.provider) + String.fromCharCode(0) + String(program.name);
  if (identities.has(identity)) error(label + " duplicates provider/name: " + program.provider + " / " + program.name);
  identities.add(identity);

  for (const field of ["categories", "program_type"]) {
    if (!Array.isArray(program[field]) || program[field].length === 0 || program[field].some((value) => !isNonEmptyString(value))) {
      error(label + "." + field + " must be a non-empty array of strings.");
    }
  }
  if (Array.isArray(program.categories)) {
    for (const category of program.categories) {
      if (!allowedCategories.has(category)) error(label + ".categories contains an unknown category: " + category);
    }
  }

  if (!Array.isArray(program.benefits) || program.benefits.length === 0) {
    error(label + ".benefits must be a non-empty array.");
  } else {
    for (const [benefitIndex, benefit] of program.benefits.entries()) {
      if (!isRecord(benefit) || !isNonEmptyString(benefit.type) || !isNonEmptyString(benefit.label)) {
        error(label + ".benefits[" + benefitIndex + "] needs non-empty type and label fields.");
      }
    }
  }

  if (!isRecord(program.eligibility)) {
    error(label + ".eligibility must be an object.");
  } else {
    for (const field of ["stages", "regions", "requirements"]) {
      if (!Array.isArray(program.eligibility[field]) || program.eligibility[field].some((value) => !isNonEmptyString(value))) {
        error(label + ".eligibility." + field + " must be an array of strings.");
      }
    }
  }

  if (!allowedStatuses.has(program.status)) {
    error(label + ".status is invalid: " + program.status);
  }
  if (["needs_review", "unknown"].includes(program.status)) {
    error(label + ".status is not publishable; verify the record and use active, paused, or expired.");
  }
  if (!allowedApplicationStates.has(program.application_state)) {
    error(label + ".application_state is invalid: " + program.application_state);
  }
  if (!allowedVerificationMethods.has(program.verification_method)) {
    error(label + ".verification_method is invalid: " + program.verification_method);
  }

  if (!isHttpUrl(program.official_url)) error(label + ".official_url must be an HTTP(S) URL.");
  if (!isHttpUrl(program.application_url)) error(label + ".application_url must be an HTTP(S) URL.");

  if (!Array.isArray(program.source_urls) || program.source_urls.length === 0 || program.source_urls.some((url) => !isHttpUrl(url))) {
    error(label + ".source_urls must contain at least one HTTP(S) URL.");
  } else if (!program.source_urls.includes(program.official_url)) {
    error(label + ".source_urls must include official_url.");
  }

  if (program.deadline !== null && !isIsoDate(program.deadline)) {
    error(label + ".deadline must be an ISO date or null.");
  }
  if (program.last_verified_at !== null && !isIsoDate(program.last_verified_at)) {
    error(label + ".last_verified_at must be an ISO date or null.");
  }
  for (const field of ["separate_application", "referral_only"]) {
    if (program[field] !== null && typeof program[field] !== "boolean") {
      error(label + "." + field + " must be boolean or null.");
    }
  }

  if (program.status === "active") {
    if (program.last_verified_at === null) {
      error(label + " marked active without last_verified_at.");
    } else if (ageInDays(program.last_verified_at) > 30) {
      error(label + " has not been verified within 30 days.");
    }
    if (program.verification_method === "readme_import") {
      error(label + " marked active with readme_import verification.");
    }
  }
  if (["paused", "expired"].includes(program.status) && !isNonEmptyString(program.verification_notes)) {
    error(label + "." + program.status + " records need verification_notes.");
  }
}

if (errors.length > 0) {
  console.error("Program data validation failed with " + errors.length + " error(s):");
  for (const message of errors) console.error("- " + message);
  process.exit(1);
}

const counts = Object.fromEntries([...allowedStatuses].map((status) => [status, 0]));
for (const program of data.programs) counts[program.status] += 1;
const summary = [...allowedStatuses]
  .filter((status) => counts[status] > 0)
  .map((status) => counts[status] + " " + status)
  .join(", ");
console.log("Validated " + data.programs.length + " programs (" + summary + ").");
