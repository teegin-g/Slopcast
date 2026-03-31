#!/usr/bin/env node
/**
 * AI Visual Regression Reviewer
 *
 * Reads pixelmatch diff results, sends before/after/diff images to Claude Sonnet
 * for semantic classification, and outputs a structured review document.
 *
 * Usage:
 *   node scripts/visual-review.mjs [options]
 *
 * Options:
 *   --diff-summary <path>   Path to diff/summary.json (default: auto-detect from after dir)
 *   --baseline-dir <path>   Baseline screenshot directory
 *   --after-dir <path>      After screenshot directory
 *   --diff-dir <path>       Diff image directory (default: sibling of after-dir)
 *   --task-brief <text>     Task description (inline)
 *   --task-brief-file <path> Path to task brief file
 *   --output <path>         Output path for review doc (default: artifacts/ui/visual-review.md)
 *   --stories-summary <path> Optional: Storybook diff summary.json
 *
 * Environment:
 *   ANTHROPIC_API_KEY       API key (or via Databricks proxy)
 *   ANTHROPIC_BASE_URL      Base URL override (for Databricks proxy)
 *   VISUAL_REVIEW_MODEL     Model to use (default: claude-sonnet-4-6)
 *   TASK_BRIEF              Inline task brief (fallback)
 *   TASK_BRIEF_FILE         Path to task brief file (fallback)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const opts = {};
const BOOLEAN_FLAGS = new Set(['dry-run']);

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    if (BOOLEAN_FLAGS.has(key)) {
      opts[key] = true;
    } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
      opts[key] = args[++i];
    }
  }
}

const diffSummaryPath = opts['diff-summary'];
const baselineDir = opts['baseline-dir'];
const afterDir = opts['after-dir'];
const diffDir = opts['diff-dir'];
const storiesSummaryPath = opts['stories-summary'];
const dryRun = !!opts['dry-run'];
const outputPath = opts.output || path.join('artifacts', 'ui', 'visual-review.md');

const taskBrief =
  opts['task-brief'] ||
  process.env.TASK_BRIEF ||
  (opts['task-brief-file'] || process.env.TASK_BRIEF_FILE
    ? await fs.readFile(opts['task-brief-file'] || process.env.TASK_BRIEF_FILE, 'utf8').catch(() => 'No task brief provided.')
    : 'No task brief provided.');

const modelId = process.env.VISUAL_REVIEW_MODEL || process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'claude-sonnet-4-6';
const apiKey = process.env.ANTHROPIC_API_KEY;
const baseURL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readJSON(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function imageToBase64Content(buffer) {
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: 'image/png',
      data: buffer.toString('base64'),
    },
  };
}

function parseScreenshotName(filename) {
  // Pattern: {viewport}__{theme}__{view}.png
  const match = filename.replace('.png', '').match(/^(\w+)__(\w+)__(.+)$/);
  if (!match) return { viewport: 'unknown', theme: 'unknown', view: filename };
  return { viewport: match[1], theme: match[2], view: match[3] };
}

async function loadPromptTemplate() {
  const templatePath = path.join(path.dirname(new URL(import.meta.url).pathname), 'visual-review-prompt.md');
  const template = await fs.readFile(templatePath, 'utf8');
  return template.replace('{{TASK_BRIEF}}', taskBrief);
}

function classifyByDiffPct(diffPct) {
  if (diffPct <= 0.5) return { classification: 'EXPECTED', summary: `${diffPct}% diff — within noise threshold` };
  if (diffPct <= 2)   return { classification: 'ACCEPTABLE', summary: `${diffPct}% diff — minor change` };
  if (diffPct <= 5)   return { classification: 'CONCERN', summary: `${diffPct}% diff — notable change, review recommended` };
  return { classification: 'REGRESSION', summary: `${diffPct}% diff — significant change, likely regression` };
}

// ---------------------------------------------------------------------------
// API call to Claude (using raw fetch — no SDK dependency needed)
// ---------------------------------------------------------------------------

async function callClaude(systemPrompt, userContent) {
  const resp = await fetch(`${baseURL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${errBody}`);
  }

  const json = await resp.json();
  const text = json.content?.find(b => b.type === 'text')?.text || '';
  return text;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Load diff summary
  let summary;
  if (diffSummaryPath) {
    summary = await readJSON(diffSummaryPath);
  } else {
    // Try to find summary.json from common locations
    const candidates = [
      path.join('artifacts', 'ui', 'diff', 'summary.json'),
      path.join('.agents', 'state', 'diff', 'summary.json'),
    ];
    for (const c of candidates) {
      try {
        summary = await readJSON(c);
        break;
      } catch { /* try next */ }
    }
  }

  if (!summary) {
    console.log('No diff summary found. Nothing to review.');
    process.exit(0);
  }

  // Also load stories summary if available
  let storiesSummary = null;
  if (storiesSummaryPath) {
    try {
      storiesSummary = await readJSON(storiesSummaryPath);
    } catch { /* optional */ }
  }

  // Filter to changed files
  const changedFiles = (summary.files || []).filter(
    f => f.status !== 'PASS' || (f.diffPct && f.diffPct > 0)
  );

  const changedStories = storiesSummary
    ? (storiesSummary.files || []).filter(f => f.status !== 'PASS' || (f.diffPct && f.diffPct > 0))
    : [];

  const totalFiles = (summary.files || []).length;
  const totalStories = storiesSummary ? (storiesSummary.files || []).length : 0;

  console.log(`Review scope: ${changedFiles.length}/${totalFiles} app screenshots changed, ${changedStories.length}/${totalStories} stories changed`);

  // If no API key, output pixelmatch-only summary
  if (!apiKey) {
    console.log('No ANTHROPIC_API_KEY set — generating pixelmatch-only report (no AI review).');
    const report = generatePixelmatchReport(summary, storiesSummary, changedFiles, changedStories, totalFiles, totalStories);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, report, 'utf8');
    console.log(`Report written to ${outputPath}`);
    return;
  }

  if (dryRun) {
    console.log('Dry-run mode — generating synthetic review from pixelmatch data (no API call).');
    const syntheticFindings = (summary.files || [])
      .filter(f => f.status !== 'PASS' || (f.diffPct && f.diffPct > 0))
      .map(entry => {
        const { viewport, theme, view } = parseScreenshotName(entry.file);
        const { classification, summary: desc } = classifyByDiffPct(entry.diffPct ?? 0);
        return {
          file: entry.file, theme, viewport, view, classification,
          summary: desc,
          details: (classification === 'CONCERN' || classification === 'REGRESSION')
            ? `Pixelmatch: ${entry.diffPct}% diff (${entry.numDiffPixels ?? '?'}/${entry.totalPixels ?? '?'} pixels). Manual review recommended.`
            : undefined,
        };
      });

    const report = generateFullReport(syntheticFindings, changedStories, summary, storiesSummary, totalFiles, totalStories, 'pixelmatch-heuristic (dry-run)');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, report, 'utf8');
    console.log(`Dry-run report written to ${outputPath}`);

    const regCount = syntheticFindings.filter(f => f.classification === 'REGRESSION').length;
    if (regCount > 0) {
      console.log(`REGRESSION — ${regCount} regression(s) flagged by heuristic`);
      process.exit(1);
    }
    return;
  }

  if (changedFiles.length === 0 && changedStories.length === 0) {
    console.log('No visual changes detected. Skipping AI review.');
    const report = generateNoChangesReport(totalFiles, totalStories);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, report, 'utf8');
    console.log(`Report written to ${outputPath}`);
    return;
  }

  // Load prompt
  const systemPrompt = await loadPromptTemplate();

  // Resolve directories
  const resolvedBaselineDir = baselineDir || summary.baselineDir;
  const resolvedAfterDir = afterDir || summary.afterDir;
  const resolvedDiffDir = diffDir || summary.diffDir;

  // Batch changed screenshots and send to Claude
  const BATCH_SIZE = 4; // 4 triplets per call (before+after+diff = 12 images max per call)
  const allFindings = [];

  for (let i = 0; i < changedFiles.length; i += BATCH_SIZE) {
    const batch = changedFiles.slice(i, i + BATCH_SIZE);
    const userContent = [];

    userContent.push({
      type: 'text',
      text: `Review the following ${batch.length} screenshot pair(s). For each, I'm showing the BEFORE (baseline), AFTER (current), and DIFF (highlighted changes) images.`,
    });

    for (const entry of batch) {
      const { viewport, theme, view } = parseScreenshotName(entry.file);
      userContent.push({
        type: 'text',
        text: `\n--- Screenshot: ${entry.file} (${viewport} / ${theme} / ${view}) — pixelmatch diff: ${entry.diffPct}% ---`,
      });

      // Load before/after/diff images
      try {
        if (resolvedBaselineDir) {
          const beforeBuf = await fs.readFile(path.join(resolvedBaselineDir, entry.file));
          userContent.push(imageToBase64Content(beforeBuf));
          userContent.push({ type: 'text', text: 'BEFORE (baseline)' });
        }

        if (resolvedAfterDir) {
          const afterBuf = await fs.readFile(path.join(resolvedAfterDir, entry.file));
          userContent.push(imageToBase64Content(afterBuf));
          userContent.push({ type: 'text', text: 'AFTER (current)' });
        }

        if (resolvedDiffDir) {
          try {
            const diffBuf = await fs.readFile(path.join(resolvedDiffDir, entry.file));
            userContent.push(imageToBase64Content(diffBuf));
            userContent.push({ type: 'text', text: 'DIFF (highlighted pixels)' });
          } catch {
            userContent.push({ type: 'text', text: '(no diff image available)' });
          }
        }
      } catch (err) {
        userContent.push({ type: 'text', text: `(could not load images: ${err.message})` });
      }
    }

    userContent.push({
      type: 'text',
      text: '\nClassify each screenshot pair. Return ONLY a JSON array, no markdown fences.',
    });

    console.log(`Reviewing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(changedFiles.length / BATCH_SIZE)}...`);

    try {
      const response = await callClaude(systemPrompt, userContent);
      // Extract JSON array from response — strip fences and surrounding text
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in AI response');
      const findings = JSON.parse(jsonMatch[0]);
      allFindings.push(...(Array.isArray(findings) ? findings : [findings]));
    } catch (err) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${err.message}`);
      // Fall back to pixelmatch-only classification for this batch
      for (const entry of batch) {
        const { viewport, theme, view } = parseScreenshotName(entry.file);
        const { classification, summary: desc } = classifyByDiffPct(entry.diffPct ?? 0);
        allFindings.push({
          file: entry.file, theme, viewport, view, classification,
          summary: `${desc} (AI review failed — manual check recommended)`,
          details: `AI review error: ${err.message}`,
        });
      }
    }
  }

  // Generate the review document
  const report = generateFullReport(allFindings, changedStories, summary, storiesSummary, totalFiles, totalStories);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, report, 'utf8');
  console.log(`Review written to ${outputPath}`);

  // Print verdict
  const regressionCount = allFindings.filter(f => f.classification === 'REGRESSION').length;
  const concernCount = allFindings.filter(f => f.classification === 'CONCERN').length;

  if (regressionCount > 0) {
    console.log(`REGRESSION — ${regressionCount} regression(s) found`);
    process.exit(1);
  } else if (concernCount > 0) {
    console.log(`CONCERN — ${concernCount} concern(s) flagged for review`);
    // Exit 0 — concerns are warnings, not failures
  } else {
    console.log('PASS — all changes classified as EXPECTED or ACCEPTABLE');
  }
}

// ---------------------------------------------------------------------------
// Report generators
// ---------------------------------------------------------------------------

function generateFullReport(findings, changedStories, summary, storiesSummary, totalFiles, totalStories, reviewerLabel = 'Claude Sonnet (automated)') {
  const counts = { EXPECTED: 0, ACCEPTABLE: 0, CONCERN: 0, REGRESSION: 0 };
  for (const f of findings) {
    counts[f.classification] = (counts[f.classification] || 0) + 1;
  }

  const hasRegression = counts.REGRESSION > 0;
  const hasConcern = counts.CONCERN > 0;
  const verdict = hasRegression ? 'FAIL' : hasConcern ? 'WARN' : 'PASS';

  let md = `# Visual Regression Review

**Date:** ${new Date().toISOString()}
**Reviewer:** ${reviewerLabel}
**Model:** ${reviewerLabel.includes('dry-run') ? 'N/A (no API call)' : modelId}
**Scope:** ${findings.length} screenshots changed out of ${totalFiles} total

## Summary

| Status | Count |
|--------|-------|
| EXPECTED | ${counts.EXPECTED} |
| ACCEPTABLE | ${counts.ACCEPTABLE} |
| CONCERN | ${counts.CONCERN} |
| REGRESSION | ${counts.REGRESSION} |

**Verdict: ${verdict}**${hasRegression ? ' — regressions detected, gate should fail' : hasConcern ? ' — concerns flagged for review' : ' — all changes look intentional'}

## Task Brief

> ${taskBrief.split('\n').join('\n> ')}

`;

  // Group findings by classification
  for (const cls of ['REGRESSION', 'CONCERN', 'EXPECTED', 'ACCEPTABLE']) {
    const items = findings.filter(f => f.classification === cls);
    if (items.length === 0) continue;

    md += `## ${cls}\n\n`;
    md += `| Screenshot | Theme | Viewport | View | Diff% | Summary |\n`;
    md += `|-----------|-------|----------|------|-------|---------|\n`;

    for (const item of items) {
      const diffPct = summary.files?.find(f => f.file === item.file)?.diffPct ?? '—';
      md += `| ${item.file} | ${item.theme} | ${item.viewport} | ${item.view} | ${diffPct}% | ${item.summary} |\n`;
    }
    md += '\n';

    // Add details for CONCERN and REGRESSION
    if (cls === 'CONCERN' || cls === 'REGRESSION') {
      for (const item of items) {
        if (item.details) {
          md += `**${item.file}:** ${item.details}\n\n`;
        }
      }
    }
  }

  // Storybook section
  if (changedStories.length > 0) {
    md += `## Storybook Components\n\n`;
    md += `| Story File | Diff% | Status |\n`;
    md += `|-----------|-------|--------|\n`;
    for (const entry of changedStories) {
      md += `| ${entry.file} | ${entry.diffPct}% | ${entry.status} |\n`;
    }
    md += '\n';
  }

  // Fixer recommendations
  const fixable = findings.filter(f => f.fixSuggestion);
  if (fixable.length > 0) {
    md += `## Fixer Recommendations\n\n`;
    md += `If the fixer agent is invoked, it should address:\n\n`;
    for (let i = 0; i < fixable.length; i++) {
      md += `${i + 1}. **${fixable[i].file}**: ${fixable[i].fixSuggestion}\n`;
    }
    md += '\n';
  }

  return md;
}

function generatePixelmatchReport(summary, storiesSummary, changedFiles, changedStories, totalFiles, totalStories) {
  let md = `# Visual Regression Review (Pixelmatch Only)

**Date:** ${new Date().toISOString()}
**Reviewer:** pixelmatch (no AI — set ANTHROPIC_API_KEY to enable)
**Scope:** ${changedFiles.length}/${totalFiles} app screenshots changed, ${changedStories.length}/${totalStories} stories changed

## App Screenshots

| Screenshot | Diff% | Status |
|-----------|-------|--------|
`;
  for (const f of summary.files || []) {
    md += `| ${f.file} | ${f.diffPct}% | ${f.status} |\n`;
  }

  if (changedStories.length > 0) {
    md += `\n## Storybook Components\n\n`;
    md += `| Story | Diff% | Status |\n`;
    md += `|-------|-------|--------|\n`;
    for (const f of changedStories) {
      md += `| ${f.file} | ${f.diffPct}% | ${f.status} |\n`;
    }
  }

  md += `\n**Overall:** ${summary.result}\n`;
  return md;
}

function generateNoChangesReport(totalFiles, totalStories) {
  return `# Visual Regression Review

**Date:** ${new Date().toISOString()}
**Scope:** ${totalFiles} app screenshots, ${totalStories} story screenshots

**Verdict: PASS** — No visual changes detected.
`;
}

main().catch((err) => {
  process.stderr.write((err && err.stack) ? `${err.stack}\n` : `${String(err)}\n`);
  process.exit(1);
});
