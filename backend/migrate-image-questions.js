/**
 * One-time migration: extracts "[IMAGE DESCRIPTION: ...]" text out of
 * question_text and converts it into structured fields:
 *   - image_title      (short label, derived or left for manual fill-in)
 *   - key_findings     (array of bullet-point findings, split from the description)
 *   - image_url        (empty string — fill in once you have real images)
 *
 * Run: node migrate-image-questions.js path/to/SP_ANATOMY_01.json
 * It writes a new file alongside it with suffix ".migrated.json"
 * so you can review before overwriting the original.
 */

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node migrate-image-questions.js <path-to-json>');
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(raw);

const IMAGE_DESC_REGEX = /\[IMAGE DESCRIPTION:\s*([\s\S]*?)\]\s*/i;

let migratedCount = 0;

for (const q of data.questions) {
  if (!q.image_based) continue; // skip non-image questions entirely

  const match = q.question_text.match(IMAGE_DESC_REGEX);
  if (!match) {
    console.warn(`⚠️  ${q.question_id} is image_based but no bracket found — skipping text extraction`);
    // still tag the fields so the schema is consistent
    q.is_image_based = true;
    q.image_title = q.image_title || '';
    q.image_url = q.image_url || '';
    q.key_findings = q.key_findings || [];
    continue;
  }

  const description = match[1].trim();

  // Split the description into bullet-style findings.
  // Heuristic: split on ". " (sentence boundaries) but keep clinical phrases intact.
  const findings = description
    .split(/\.\s+(?=[A-Z])/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean);

  // Remove the bracketed description from question_text, trim leading whitespace/newlines
  const cleanedText = q.question_text.replace(IMAGE_DESC_REGEX, '').trim();

  q.is_image_based = true;
  q.image_title = q.image_title || ''; // fill in manually later, e.g. "MRI Brain — Axial T2"
  q.image_url = q.image_url || '';      // fill in once real image is hosted
  q.key_findings = findings;
  q.question_text = cleanedText;

  migratedCount++;
}

const outPath = inputPath.replace(/\.json$/, '.migrated.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');

console.log(`✅ Migrated ${migratedCount} image-based questions.`);
console.log(`📄 Output written to: ${outPath}`);
console.log(`Review it, fill in image_title/image_url manually, then replace your original file.`);