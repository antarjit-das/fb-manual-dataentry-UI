/**
 * parser.ts — Staged Facebook clipboard raw text parser.
 *
 * Implements the authoritative canonical contract:
 *  - Segments raw Facebook clipboard text into top-level comments and nested replies.
 *  - Recovers commenter_name for comments and replies.
 *  - Retains parent author reference prefixes inside reply_text without stripping.
 *  - Discards empty / media-only comments without creating records.
 *  - Contextually removes Facebook UI buttons ('Reply') and notice banners.
 *  - Classifies language ('en', 'bn', 'as', 'hi', 'brx', 'ne', 'mixed', 'other').
 *  - Initializes likes to 0.
 *  - Emits CanonicalDataset and ParseMetrics.
 */

import type { CanonicalDataset, CanonicalComment, CanonicalReply, ParseMetrics, ParseResult } from "./types.ts";
import { CanonicalDatasetSchema } from "./schemas.ts";

// ────────────────────────────────────────────────────────────────────────────
// 1. Unicode & Whitespace Normalization
// ────────────────────────────────────────────────────────────────────────────

export function normalizeRawText(raw: string): string {
  if (!raw) return "";
  return (
    raw
      // Normalize CRLF to LF
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Replace non-breaking spaces and zero-width non-character spaces
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      // Remove trailing space on each line
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Language Detection
// ────────────────────────────────────────────────────────────────────────────

// Common Romanized Bengali / code-mixed phonetic tokens
const ROMANIZED_BENGALI_TOKENS = new Set([
  "oder", "ar", "moja", "kichhu", "kichu", "nai", "bina", "poysaye", "poysa", "tar",
  "kata", "obdhi", "aschhe", "asche", "age", "tow", "paa", "guli", "hobe", "ami",
  "amra", "tomra", "tader", "kore", "korlo", "korte", "hobe", "shala", "shalader",
  "valo", "bhalo", "khub", "kemon", "achho", "acho", "ki", "keno", "kothay", "ei",
  "oi", "shei", "tai", "kar", "kake", "ekta", "duita", "manush", "desh", "desher",
  "dada", "didi", "bhai", "bon", "shobar", "sob", "shob", "dekhe", "dekhun", "bolun",
  "bolo", "bolte", "korchen", "korcho", "korchi", "hoyeche", "hoyni", "jani", "janen",
]);

/**
 * Detect language of a comment or reply text independently.
 * Returns ISO-compatible codes: 'en', 'bn', 'as', 'hi', 'ne', 'brx', 'mixed', 'other'.
 */
export function detectLanguage(text: string): string {
  if (!text || !text.trim()) return "en";
  const trimmed = text.trim();

  // Character counts by script
  let bengaliCount = 0;
  let assameseSpecificCount = 0; // 'ৰ' (\u09F0), 'ৱ' (\u09F1)
  let devanagariCount = 0;
  let latinCount = 0;

  for (const ch of trimmed) {
    const code = ch.charCodeAt(0);
    if (ch === "ৰ" || ch === "ৱ") {
      assameseSpecificCount++;
      bengaliCount++;
    } else if (code >= 0x0980 && code <= 0x09ff) {
      bengaliCount++;
    } else if (code >= 0x0900 && code <= 0x097f) {
      devanagariCount++;
    } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      latinCount++;
    }
  }

  const totalLetters = bengaliCount + devanagariCount + latinCount;
  if (totalLetters === 0) return "other";

  // Check Assamese specificity
  if (assameseSpecificCount > 0 && bengaliCount > 0 && latinCount === 0) {
    return "as";
  }

  // Pure or predominant Bengali script
  if (bengaliCount > 0 && latinCount === 0 && devanagariCount === 0) {
    return "bn";
  }

  // Pure or predominant Devanagari script
  if (devanagariCount > 0 && latinCount === 0 && bengaliCount === 0) {
    return "hi";
  }

  // Mixed scripts (e.g. Bengali + English words or Devanagari + English)
  if (bengaliCount > 0 && latinCount > 0) {
    return "mixed";
  }
  if (devanagariCount > 0 && (latinCount > 0 || bengaliCount > 0)) {
    return "mixed";
  }

  // If exclusively Latin script, inspect for Romanized / code-mixed vocabulary
  if (latinCount > 0 && bengaliCount === 0 && devanagariCount === 0) {
    const words = trimmed
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    let romanizedMatches = 0;
    for (const w of words) {
      if (ROMANIZED_BENGALI_TOKENS.has(w)) {
        romanizedMatches++;
      }
    }

    // If significant proportion of tokens are Romanized Bengali
    if (romanizedMatches >= 2 || (words.length <= 4 && romanizedMatches >= 1)) {
      return "mixed";
    }

    return "en";
  }

  return "en";
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Structural Tokenization & Artifact Filtering
// ────────────────────────────────────────────────────────────────────────────

// Known Facebook system notices that should be contextually removed
const FB_NOTICES = [
  /^most relevant is selected/i,
  /^all comments/i,
  /^top comments/i,
  /^view more comments/i,
  /^view more replies/i,
  /^view previous replies/i,
  /^write a comment/i,
  /^write a public comment/i,
  /^press enter to post/i,
  /^view \d+ more repl/i,
];

// Dot / separator indicators used by Facebook between name and time/text
const FB_SEPARATORS = new Set(["·", "•", "●", "∙", "⋅", "."]);

function isFacebookNotice(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  return FB_NOTICES.some((rx) => rx.test(t));
}

function isFacebookSeparator(line: string): boolean {
  const t = line.trim();
  return FB_SEPARATORS.has(t) || /^[·•●∙⋅]$/.test(t);
}

function isIsolatedReplyButton(line: string): boolean {
  const t = line.trim();
  return (
    t === "Reply" ||
    t === "উত্তর দিন" ||
    t === "উত্তৰ দিয়ক" ||
    t === "जवाब दें" ||
    t === "Like" ||
    t === "React" ||
    t === "Share"
  );
}

// Timestamp-like strings commonly appearing next to FB separator (e.g. "1d", "3h", "1w", "Just now", "2 hrs")
function isFacebookTimestamp(line: string): boolean {
  const t = line.trim();
  return /^(just now|\d+\s*(m|h|d|w|y|min|mins|hr|hrs|hour|hours|day|days|week|weeks|yr|yrs|year|years)(\s*ago)?)$/i.test(
    t
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Staged Segment Reconstruction
// ────────────────────────────────────────────────────────────────────────────

interface RawBlock {
  author: string;
  lines: string[];
  isReply: boolean;
  replyToAuthor?: string;
}

/**
 * Parses raw Facebook clipboard text into raw block structures.
 */
export function segmentBlocks(rawText: string): {
  blocks: RawBlock[];
  mediaOnlyDiscarded: number;
} {
  const normalized = normalizeRawText(rawText);
  const rawLines = normalized.split("\n");

  // Step 1: Filter out isolated Facebook system notices
  const filteredLines: string[] = [];
  for (const line of rawLines) {
    if (isFacebookNotice(line)) {
      continue;
    }
    filteredLines.push(line);
  }

  // Step 2: Segment into comment/reply units using name + separator patterns
  const blocks: RawBlock[] = [];
  let mediaOnlyDiscarded = 0;

  let currentAuthor: string | null = null;
  let currentContentLines: string[] = [];
  let i = 0;

  const pushCurrent = () => {
    if (!currentAuthor) return;

    // Clean trailing empty lines and isolated UI buttons iteratively
    while (currentContentLines.length > 0) {
      const last = currentContentLines[currentContentLines.length - 1].trim();
      if (!last || isIsolatedReplyButton(last)) {
        currentContentLines.pop();
      } else {
        break;
      }
    }

    // Clean leading empty lines
    while (currentContentLines.length > 0 && !currentContentLines[0].trim()) {
      currentContentLines.shift();
    }

    const text = currentContentLines.join("\n").trim();

    if (!text) {
      // Empty content => media-only comment discarded!
      mediaOnlyDiscarded++;
    } else {
      blocks.push({
        author: currentAuthor,
        lines: [...currentContentLines],
        isReply: false, // determined in hierarchy stage
      });
    }

    currentAuthor = null;
    currentContentLines = [];
  };

  while (i < filteredLines.length) {
    const line = filteredLines[i];

    // Lookahead check for:
    // Pattern A:
    // [Line i]: Person Name
    // [Line i+1]: · (separator)
    // [Line i+2]: (optional timestamp / text)
    if (
      line.trim() &&
      i + 1 < filteredLines.length &&
      isFacebookSeparator(filteredLines[i + 1]) &&
      !isIsolatedReplyButton(line)
    ) {
      // We found a new commenter header!
      pushCurrent();
      currentAuthor = line.trim();
      i += 2; // skip name and separator
      // If the line right after separator is a timestamp, skip it
      if (i < filteredLines.length && isFacebookTimestamp(filteredLines[i])) {
        i++;
      }
      continue;
    }

    // Pattern B:
    // [Line i]: Person Name · Timestamp or Person Name •
    const inlineSepMatch = line.match(/^([^\n·•●∙⋅]{2,50})\s*[·•●∙⋅]\s*(.*)$/);
    if (
      inlineSepMatch &&
      !isIsolatedReplyButton(line) &&
      inlineSepMatch[1].trim().length > 1
    ) {
      pushCurrent();
      currentAuthor = inlineSepMatch[1].trim();
      const rest = inlineSepMatch[2].trim();
      if (rest && !isFacebookTimestamp(rest)) {
        currentContentLines.push(rest);
      }
      i++;
      continue;
    }

    if (currentAuthor !== null) {
      // Accumulate content line for current block
      // If we encounter an isolated 'Reply' line, it may mark the end of this block's content
      if (isIsolatedReplyButton(line)) {
        // Lookahead: if the very next line is a name + separator, this is indeed the closing button
        if (
          i + 2 < filteredLines.length &&
          isFacebookSeparator(filteredLines[i + 2])
        ) {
          pushCurrent();
          i++;
          continue;
        }
      }
      currentContentLines.push(line);
    }

    i++;
  }

  // Push final open block if any
  pushCurrent();

  return { blocks, mediaOnlyDiscarded };
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Hierarchy Reconstruction & Canonical Dataset Building
// ────────────────────────────────────────────────────────────────────────────

/**
 * Reconstructs hierarchical CanonicalDataset from segmented blocks.
 * Uses leading parent names as structural hierarchy signals, while
 * strictly PRESERVING the full text inside `reply_text`.
 */
export function buildCanonicalDataset(
  blocks: RawBlock[],
  mediaDiscardedCount: number = 0
): ParseResult {
  const comments: CanonicalComment[] = [];
  let currentParentComment: CanonicalComment | null = null;
  const knownCommenters: string[] = [];

  let repliesDetected = 0;
  let ambiguousRecords = 0;

  for (const block of blocks) {
    const fullText = block.lines.join("\n").trim();
    if (!fullText) continue;

    // Check if the text begins with a known commenter's name (indicating a reply)
    let matchedParentName: string | null = null;

    // 1. Check active parent comment author first
    if (
      currentParentComment &&
      fullText.startsWith(currentParentComment.commenter_name)
    ) {
      matchedParentName = currentParentComment.commenter_name;
    } else {
      // 2. Check any previously known commenter name
      for (const name of knownCommenters) {
        if (name && fullText.startsWith(name)) {
          matchedParentName = name;
          break;
        }
      }
    }

    if (matchedParentName && currentParentComment) {
      // This is a reply referencing a parent author
      // CRITICAL: Preserve fullText in reply_text! Do NOT strip the matched name.
      const replyObj: CanonicalReply = {
        commenter_name: block.author,
        reply_text: fullText,
        like_count: 0,
        love_count: 0,
        haha_count: 0,
        wow_count: 0,
        sad_count: 0,
        angry_count: 0,
        care_count: 0,
        replies: [],
      };

      // If matchedParentName belongs to currentParentComment, add to currentParentComment
      if (currentParentComment.commenter_name === matchedParentName) {
        currentParentComment.replies = currentParentComment.replies || [];
        currentParentComment.replies.push(replyObj);
      } else {
        // Find the matching parent comment in comments array
        const targetParent = comments.find(
          (c) => c.commenter_name === matchedParentName
        );
        if (targetParent) {
          targetParent.replies = targetParent.replies || [];
          targetParent.replies.push(replyObj);
        } else {
          currentParentComment.replies = currentParentComment.replies || [];
          currentParentComment.replies.push(replyObj);
        }
      }
      repliesDetected++;
    } else {
      // This is a new top-level comment
      const newComment: CanonicalComment = {
        commenter_name: block.author,
        comment_text: fullText,
        like_count: 0,
        love_count: 0,
        haha_count: 0,
        wow_count: 0,
        sad_count: 0,
        angry_count: 0,
        care_count: 0,
        replies: [],
      };
      comments.push(newComment);
      currentParentComment = newComment;
      if (!knownCommenters.includes(block.author)) {
        knownCommenters.push(block.author);
      }
    }
  }

  const dataset: CanonicalDataset = { comments };

  // Validate the dataset against CanonicalDatasetSchema
  const validation = CanonicalDatasetSchema.safeParse(dataset);
  if (!validation.success) {
    ambiguousRecords += validation.error.issues.length;
  }

  const metrics: ParseMetrics = {
    commentsDetected: comments.length,
    repliesDetected,
    mediaOnlyDiscarded: mediaDiscardedCount,
    ambiguousRecords,
  };

  return { dataset, metrics };
}

// ────────────────────────────────────────────────────────────────────────────
// 6. Main Entry Point: parseFacebookRawText
// ────────────────────────────────────────────────────────────────────────────

export function parseFacebookRawText(rawText: string): ParseResult {
  const { blocks, mediaOnlyDiscarded } = segmentBlocks(rawText);
  return buildCanonicalDataset(blocks, mediaOnlyDiscarded);
}
