# Contributing

Thanks for contributing to Awesome Builder Programs.

This repository lists programs that provide credits, grants, or tools for students, startups, and open-source builders.

## How to add or update a program

The canonical records live in data/programs.json. Edit that file rather than editing README.md; the README is generated from the structured data.

1. Make sure the program has an official page.
2. Add or update the record in the correct category.
3. Describe the benefit and eligibility from the official source.
4. Use needs_review until current availability has been manually confirmed.
5. For active records, add last_verified_at, verification_method, and verification_notes.
6. Run the validation and README generation commands.

Example record:

    {
      "slug": "example-program",
      "name": "Example Program",
      "provider": "Example",
      "categories": ["startups"],
      "program_type": ["startup_program"],
      "benefits": [{ "type": "credits", "label": "Cloud credits" }],
      "eligibility": {
        "stages": ["early_stage"],
        "regions": ["global"],
        "requirements": []
      },
      "status": "needs_review",
      "application_state": "unknown",
      "deadline": null,
      "application_url": "https://example.com/apply",
      "official_url": "https://example.com",
      "source_urls": ["https://example.com"],
      "separate_application": null,
      "referral_only": null,
      "last_verified_at": null,
      "verification_method": "official_page",
      "verification_notes": "Explain what was checked."
    }

Run:

    node scripts/validate-programs.mjs
    node scripts/generate-readme.mjs

## Rules

- Only link to official program pages.
- No affiliate or referral links.
- Keep descriptions short and source-backed.
- Do not mark a record active without a recent manual verification.
- Do not add expired programs as active opportunities.
- Note geographic, school, funding, or age eligibility limits when they apply.

## Pull requests

Open a Pull Request with a short explanation of the program or update you added. Include the official source, status rationale, and verification date.
