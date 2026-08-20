/**
 * WorkbookRepository.ts — Excel workbook persistence with atomic saves.
 *
 * This is the ONLY module that touches the filesystem for data storage.
 * All file I/O is server-side only (AGENTS.md rule 1).
 *
 * Save transaction (product_guide §13):
 *  1. Validate the payload
 *  2. Open workbook (or create from template if missing)
 *  3. Read existing IDs
 *  4. Map domain objects to sheet rows
 *  5. Write all changes to a TEMPORARY .xlsx file
 *  6. Verify the temp file opens and contains expected data
 *  7. Create a timestamped BACKUP of the current workbook
 *  8. Atomically replace the target workbook with the verified temp file
 *  9. Return success with post_id and written counts
 */

import ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import type {
  Post,
  Comment,
  Reply,
  Source,
  DataSummary,
  SaveResult,
  PostSummaryRow,
  PostFormData,
  CommentFormData,
  ReplyFormData,
} from "../types";
import { preparePayload } from "../domain";
import { generateNextId } from "../ids";
import {
  SHEET_NAMES,
  POST_COLUMNS,
  COMMENT_COLUMNS,
  REPLY_COLUMNS,
  SOURCE_COLUMNS,
  ANNOTATION_COLUMNS,
  COLLECTION_LOG_COLUMNS,
  CODEBOOK_HEADERS,
  CODEBOOK_ROWS,
} from "./templates";
import {
  postToRow,
  commentToRow,
  replyToRow,
  sourceToRow,
  rowToPost,
  rowToComment,
  rowToReply,
  rowToSource,
  rowToRecord,
} from "./mappers";

// ────────────────────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────────────────────

function getWorkbookPath(): string {
  const envPath = process.env.WORKBOOK_PATH || "./data/facebook_dataset.xlsx";
  return path.join(process.cwd(), envPath);
}

function getBackupDir(): string {
  const envPath = process.env.BACKUP_DIR || "./data/backups";
  return path.join(process.cwd(), envPath);
}

// ────────────────────────────────────────────────────────────────────────────
// Template creation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Create a new workbook with all required sheets and headers.
 * Does NOT write to disk — returns the in-memory workbook.
 */
function createTemplate(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();

  // Helper: add a sheet with headers and bold formatting
  function addSheet(name: string, columns: readonly string[]) {
    const ws = wb.addWorksheet(name);
    const headerRow = ws.addRow(columns);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2EFDA" },
      };
      cell.border = {
        bottom: { style: "thin" },
      };
    });
    // Auto-width hint (ExcelJS doesn't auto-fit, but we set reasonable defaults)
    columns.forEach((col, i) => {
      const colObj = ws.getColumn(i + 1);
      colObj.width = Math.max(col.length + 4, 12);
    });
    return ws;
  }

  addSheet(SHEET_NAMES.POSTS, POST_COLUMNS as unknown as string[]);
  addSheet(SHEET_NAMES.COMMENTS, COMMENT_COLUMNS as unknown as string[]);
  addSheet(SHEET_NAMES.REPLIES, REPLY_COLUMNS as unknown as string[]);
  addSheet(SHEET_NAMES.SOURCES, SOURCE_COLUMNS as unknown as string[]);
  addSheet(SHEET_NAMES.COLLECTION_LOG, COLLECTION_LOG_COLUMNS as unknown as string[]);
  addSheet(SHEET_NAMES.ANNOTATIONS, ANNOTATION_COLUMNS as unknown as string[]);

  // CODEBOOK sheet
  const cbWs = addSheet(SHEET_NAMES.CODEBOOK, CODEBOOK_HEADERS as unknown as string[]);
  for (const row of CODEBOOK_ROWS) {
    cbWs.addRow(row);
  }

  return wb;
}

// ────────────────────────────────────────────────────────────────────────────
// Sheet reading helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Read all data rows from a worksheet as keyed records.
 * Skips the header row (row 1).
 */
function readSheetRows(
  ws: ExcelJS.Worksheet,
  columns: readonly string[]
): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const values: unknown[] = [];
    columns.forEach((_, i) => {
      values.push(row.getCell(i + 1).value);
    });
    rows.push(rowToRecord(columns, values));
  });

  return rows;
}

/**
 * Read all values of a specific column (by header name) from a worksheet.
 */
function readColumnValues(
  ws: ExcelJS.Worksheet,
  columns: readonly string[],
  columnName: string
): string[] {
  const colIndex = columns.indexOf(columnName);
  if (colIndex === -1) return [];

  const values: string[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cellVal = row.getCell(colIndex + 1).value;
    if (cellVal !== null && cellVal !== undefined && cellVal !== "") {
      values.push(String(cellVal));
    }
  });

  return values;
}

/**
 * Find the row number for a given primary key value in a worksheet.
 * Returns -1 if not found.
 */
function findRowByKey(
  ws: ExcelJS.Worksheet,
  keyColumnIndex: number,
  keyValue: string
): number {
  let found = -1;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (String(row.getCell(keyColumnIndex).value) === keyValue) {
      found = rowNumber;
    }
  });
  return found;
}

// ────────────────────────────────────────────────────────────────────────────
// Backup
// ────────────────────────────────────────────────────────────────────────────

/**
 * Create a timestamped backup of the workbook file.
 * Returns the backup file path, or null if no file to back up.
 */
function createBackup(workbookPath: string): string | null {
  if (!fs.existsSync(workbookPath)) return null;

  const backupDir = getBackupDir();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  const ext = path.extname(workbookPath);
  const base = path.basename(workbookPath, ext);
  const backupName = `${base}_backup_${timestamp}${ext}`;
  const backupPath = path.join(backupDir, backupName);

  fs.copyFileSync(workbookPath, backupPath);
  return backupPath;
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

/**
 * Ensure the workbook exists. If it doesn't, create it from the template.
 */
export async function ensureWorkbook(): Promise<void> {
  const wbPath = getWorkbookPath();

  if (!fs.existsSync(wbPath)) {
    const dir = path.dirname(wbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const wb = createTemplate();
    await wb.xlsx.writeFile(wbPath);
  }
}

/**
 * Load the workbook from disk. Creates from template if missing.
 */
export async function loadWorkbook(): Promise<ExcelJS.Workbook> {
  await ensureWorkbook();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(getWorkbookPath());
  return wb;
}

/**
 * Get all existing IDs for each entity type.
 */
export async function getExistingIds(): Promise<{
  postIds: string[];
  commentIds: string[];
  replyIds: string[];
  sourceIds: string[];
}> {
  const wb = await loadWorkbook();

  const postsWs = wb.getWorksheet(SHEET_NAMES.POSTS);
  const commentsWs = wb.getWorksheet(SHEET_NAMES.COMMENTS);
  const repliesWs = wb.getWorksheet(SHEET_NAMES.REPLIES);
  const sourcesWs = wb.getWorksheet(SHEET_NAMES.SOURCES);

  return {
    postIds: postsWs
      ? readColumnValues(postsWs, POST_COLUMNS as unknown as string[], "post_id")
      : [],
    commentIds: commentsWs
      ? readColumnValues(commentsWs, COMMENT_COLUMNS as unknown as string[], "comment_id")
      : [],
    replyIds: repliesWs
      ? readColumnValues(repliesWs, REPLY_COLUMNS as unknown as string[], "reply_id")
      : [],
    sourceIds: sourcesWs
      ? readColumnValues(sourcesWs, SOURCE_COLUMNS as unknown as string[], "source_id")
      : [],
  };
}

/**
 * Get a summary of dataset counts for the dashboard.
 */
export async function getSummary(): Promise<DataSummary> {
  const wb = await loadWorkbook();

  const postsWs = wb.getWorksheet(SHEET_NAMES.POSTS);
  const commentsWs = wb.getWorksheet(SHEET_NAMES.COMMENTS);
  const repliesWs = wb.getWorksheet(SHEET_NAMES.REPLIES);

  // Count data rows (total rows minus header)
  const postCount = postsWs ? Math.max(postsWs.rowCount - 1, 0) : 0;
  const commentCount = commentsWs ? Math.max(commentsWs.rowCount - 1, 0) : 0;
  const replyCount = repliesWs ? Math.max(repliesWs.rowCount - 1, 0) : 0;

  // Find the most recent collection_timestamp in POSTS
  let lastSaved: string | null = null;
  if (postsWs && postCount > 0) {
    const timestamps = readColumnValues(
      postsWs,
      POST_COLUMNS as unknown as string[],
      "collection_timestamp"
    );
    if (timestamps.length > 0) {
      lastSaved = timestamps.sort().reverse()[0];
    }
  }

  return { postCount, commentCount, replyCount, lastSaved };
}

/**
 * List all posts as summary rows for the home page table.
 */
export async function listPosts(): Promise<PostSummaryRow[]> {
  const wb = await loadWorkbook();

  const postsWs = wb.getWorksheet(SHEET_NAMES.POSTS);
  const commentsWs = wb.getWorksheet(SHEET_NAMES.COMMENTS);
  const repliesWs = wb.getWorksheet(SHEET_NAMES.REPLIES);

  if (!postsWs) return [];

  const postRows = readSheetRows(postsWs, POST_COLUMNS as unknown as string[]);
  const posts = postRows.map(rowToPost);

  // Count comments and replies per post
  const commentCounts: Record<string, number> = {};
  const replyCounts: Record<string, number> = {};

  if (commentsWs) {
    const commentRows = readSheetRows(commentsWs, COMMENT_COLUMNS as unknown as string[]);
    for (const row of commentRows) {
      const pid = String(row.post_id ?? "");
      commentCounts[pid] = (commentCounts[pid] || 0) + 1;
    }
  }

  if (repliesWs) {
    const replyRows = readSheetRows(repliesWs, REPLY_COLUMNS as unknown as string[]);
    for (const row of replyRows) {
      const pid = String(row.post_id ?? "");
      replyCounts[pid] = (replyCounts[pid] || 0) + 1;
    }
  }

  return posts.map((p) => ({
    post_id: p.post_id,
    source_name: p.source_name,
    content_type: p.content_type,
    original_post_date: p.original_post_date,
    commentCount: commentCounts[p.post_id] || 0,
    replyCount: replyCounts[p.post_id] || 0,
    collection_timestamp: p.collection_timestamp,
  }));
}

/**
 * Load a single post with all its comments and replies (for edit/reopen).
 * Returns the hierarchical PostFormData shape.
 */
export async function getPost(postId: string): Promise<PostFormData | null> {
  const wb = await loadWorkbook();

  const postsWs = wb.getWorksheet(SHEET_NAMES.POSTS);
  const commentsWs = wb.getWorksheet(SHEET_NAMES.COMMENTS);
  const repliesWs = wb.getWorksheet(SHEET_NAMES.REPLIES);

  if (!postsWs) return null;

  // Find the post
  const postRows = readSheetRows(postsWs, POST_COLUMNS as unknown as string[]);
  const postRow = postRows.find((r) => String(r.post_id) === postId);
  if (!postRow) return null;

  const post = rowToPost(postRow);

  // Find all comments for this post
  const allComments: Comment[] = [];
  if (commentsWs) {
    const commentRows = readSheetRows(commentsWs, COMMENT_COLUMNS as unknown as string[]);
    for (const row of commentRows) {
      if (String(row.post_id) === postId) {
        allComments.push(rowToComment(row));
      }
    }
  }

  // Find all replies for this post
  const allReplies: Reply[] = [];
  if (repliesWs) {
    const replyRows = readSheetRows(repliesWs, REPLY_COLUMNS as unknown as string[]);
    for (const row of replyRows) {
      if (String(row.post_id) === postId) {
        allReplies.push(rowToReply(row));
      }
    }
  }

  // Reconstruct arbitrary-depth tree from flat comment and reply rows
  const replyNodes = new Map<string, ReplyFormData & { parentId: string }>();
  for (const r of allReplies) {
    const parentId = r.parent_id || (r as any).comment_id || "";
    replyNodes.set(r.reply_id, {
      reply_id: r.reply_id,
      commenter_name: "",
      reply_text: r.reply_text || "",
      like_count: r.like_count ?? null,
      love_count: r.love_count ?? null,
      haha_count: r.haha_count ?? null,
      wow_count: r.wow_count ?? null,
      sad_count: r.sad_count ?? null,
      angry_count: r.angry_count ?? null,
      care_count: r.care_count ?? null,
      collection_timestamp: r.collection_timestamp,
      replies: [],
      parentId,
    });
  }

  const commentNodes = new Map<string, CommentFormData>();
  for (const c of allComments) {
    commentNodes.set(c.comment_id, {
      comment_id: c.comment_id,
      commenter_name: "",
      comment_text: c.comment_text || "",
      like_count: c.like_count ?? null,
      love_count: c.love_count ?? null,
      haha_count: c.haha_count ?? null,
      wow_count: c.wow_count ?? null,
      sad_count: c.sad_count ?? null,
      angry_count: c.angry_count ?? null,
      care_count: c.care_count ?? null,
      collection_timestamp: c.collection_timestamp,
      replies: [],
    });
  }

  // Link each reply node to its parent reply or comment
  for (const rNode of replyNodes.values()) {
    const { parentId, ...cleanReply } = rNode;
    if (replyNodes.has(parentId)) {
      replyNodes.get(parentId)!.replies!.push(cleanReply);
    } else if (commentNodes.has(parentId)) {
      commentNodes.get(parentId)!.replies!.push(cleanReply);
    } else if (allComments.length > 0) {
      commentNodes.get(allComments[0].comment_id)!.replies!.push(cleanReply);
    }
  }

  const comments: CommentFormData[] = Array.from(commentNodes.values());

  // Return in PostFormData shape
  return {
    post_id: post.post_id,
    platform: post.platform,
    content_type: post.content_type,
    post_url: post.post_url,
    source_name: post.source_name,
    source_type: post.source_type,
    original_post_date: post.original_post_date,
    collection_date: post.collection_date,
    collection_timestamp: post.collection_timestamp,
    language: post.language || "English",
    post_text: post.post_text,
    view_count: post.view_count,
    view_count_display: post.view_count_display,
    view_count_precision: post.view_count_precision || "unavailable",
    reaction_count: post.reaction_count,
    reaction_count_display: post.reaction_count_display,
    reaction_count_precision: post.reaction_count_precision || "unavailable",
    like_count: post.like_count ?? 0,
    love_count: post.love_count ?? 0,
    haha_count: post.haha_count ?? 0,
    angry_count: post.angry_count ?? 0,
    sad_count: post.sad_count ?? 0,
    wow_count: post.wow_count ?? 0,
    care_count: post.care_count ?? 0,
    comment_count: post.comment_count,
    comment_count_display: post.comment_count_display,
    comment_count_precision: post.comment_count_precision || "unavailable",
    comments,
  };
}

/**
 * Save a new post (with comments and replies) to the workbook.
 *
 * Implements the full atomic transaction from product_guide §13:
 *  1. Validate + prepare payload (assign IDs, wire FKs)
 *  2. Load or create workbook
 *  3. Append rows to POSTS, COMMENTS, REPLIES sheets
 *  4. Create/update SOURCE if needed
 *  5. Write to temp file
 *  6. Verify temp file
 *  7. Backup original
 *  8. Replace original with verified temp
 */
export async function savePost(formData: PostFormData): Promise<SaveResult> {
  const wbPath = getWorkbookPath();
  const tempPath = wbPath + ".tmp";

  // 1. Get existing IDs and prepare payload
  const { postIds, commentIds, replyIds, sourceIds } = await getExistingIds();
  const { post, comments, replies } = preparePayload(
    formData,
    postIds,
    commentIds,
    replyIds
  );

  // 2. Load workbook
  const wb = await loadWorkbook();
  const postsWs = wb.getWorksheet(SHEET_NAMES.POSTS)!;
  const commentsWs = wb.getWorksheet(SHEET_NAMES.COMMENTS)!;
  const repliesWs = wb.getWorksheet(SHEET_NAMES.REPLIES)!;
  const sourcesWs = wb.getWorksheet(SHEET_NAMES.SOURCES)!;

  // 3. Append post row
  postsWs.addRow(postToRow(post));

  // 4. Append comment rows
  for (const comment of comments) {
    commentsWs.addRow(commentToRow(comment));
  }

  // 5. Append reply rows
  for (const reply of replies) {
    repliesWs.addRow(replyToRow(reply));
  }

  // 6. Create/update source record
  const existingSourceNames = readColumnValues(
    sourcesWs,
    SOURCE_COLUMNS as unknown as string[],
    "source_name"
  );
  if (
    post.source_name &&
    !existingSourceNames.includes(post.source_name)
  ) {
    const sourceId = generateNextId("source", sourceIds);
    const source: Source = {
      source_id: sourceId,
      source_name: post.source_name,
      source_type: post.source_type,
      source_url: post.source_url,
    };
    sourcesWs.addRow(sourceToRow(source));
  }

  // 7. Write to temp file
  await wb.xlsx.writeFile(tempPath);

  // 8. Verify temp file
  try {
    const verifyWb = new ExcelJS.Workbook();
    await verifyWb.xlsx.readFile(tempPath);

    // Check that required sheets exist
    const requiredSheets = [
      SHEET_NAMES.POSTS,
      SHEET_NAMES.COMMENTS,
      SHEET_NAMES.REPLIES,
    ];
    for (const sheetName of requiredSheets) {
      if (!verifyWb.getWorksheet(sheetName)) {
        throw new Error(`Verification failed: sheet "${sheetName}" missing from temp file`);
      }
    }
  } catch (verifyError) {
    // Clean up temp file on verification failure
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw new Error(
      `Workbook verification failed after write. Original file is unchanged. ` +
        `Error: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`
    );
  }

  // 9. Backup original
  createBackup(wbPath);

  // 10. Atomic replace
  fs.renameSync(tempPath, wbPath);

  return {
    postId: post.post_id,
    commentsWritten: comments.length,
    repliesWritten: replies.length,
    timestamp: post.collection_timestamp,
  };
}

/**
 * Update an existing post (and its comments/replies) in the workbook.
 *
 * Strategy: delete all existing rows for this post_id across all three
 * sheets, then re-append the updated rows. This is simpler and safer
 * than in-place row updates for the MVP, and the atomic write guarantees
 * no partial state.
 */
export async function updatePost(formData: PostFormData): Promise<SaveResult> {
  if (!formData.post_id) {
    throw new Error("Cannot update a post without a post_id");
  }

  const wbPath = getWorkbookPath();
  const tempPath = wbPath + ".tmp";
  const postId = formData.post_id;

  // 1. Get existing IDs (excluding the ones we're about to replace)
  const wb = await loadWorkbook();
  const postsWs = wb.getWorksheet(SHEET_NAMES.POSTS)!;
  const commentsWs = wb.getWorksheet(SHEET_NAMES.COMMENTS)!;
  const repliesWs = wb.getWorksheet(SHEET_NAMES.REPLIES)!;
  const sourcesWs = wb.getWorksheet(SHEET_NAMES.SOURCES)!;

  // Collect existing IDs that do NOT belong to this post (for generation)
  const otherPostIds = readColumnValues(
    postsWs,
    POST_COLUMNS as unknown as string[],
    "post_id"
  ).filter((id) => id !== postId);

  const existingCommentRows = readSheetRows(
    commentsWs,
    COMMENT_COLUMNS as unknown as string[]
  );
  const otherCommentIds = existingCommentRows
    .filter((r) => String(r.post_id) !== postId)
    .map((r) => String(r.comment_id));

  const existingReplyRows = readSheetRows(
    repliesWs,
    REPLY_COLUMNS as unknown as string[]
  );
  const otherReplyIds = existingReplyRows
    .filter((r) => String(r.post_id) !== postId)
    .map((r) => String(r.reply_id));

  // Include the post_id itself in the existing list so we reuse it
  const allPostIds = [...otherPostIds, postId];

  // 2. Prepare payload — reuse existing IDs where present
  const { post, comments, replies } = preparePayload(
    formData,
    allPostIds,
    otherCommentIds,
    otherReplyIds
  );

  // 3. Remove old rows for this post from all sheets
  // We rebuild the sheets: keep header + rows not belonging to this post, then add new rows
  removeRowsByPostId(postsWs, POST_COLUMNS as unknown as string[], "post_id", postId);
  removeRowsByPostId(commentsWs, COMMENT_COLUMNS as unknown as string[], "post_id", postId);
  removeRowsByPostId(repliesWs, REPLY_COLUMNS as unknown as string[], "post_id", postId);

  // 4. Append new rows
  postsWs.addRow(postToRow(post));
  for (const comment of comments) {
    commentsWs.addRow(commentToRow(comment));
  }
  for (const reply of replies) {
    repliesWs.addRow(replyToRow(reply));
  }

  // 5. Update source if needed
  const existingSourceNames = readColumnValues(
    sourcesWs,
    SOURCE_COLUMNS as unknown as string[],
    "source_name"
  );
  const sourceIds = readColumnValues(
    sourcesWs,
    SOURCE_COLUMNS as unknown as string[],
    "source_id"
  );
  if (
    post.source_name &&
    !existingSourceNames.includes(post.source_name)
  ) {
    const sourceId = generateNextId("source", sourceIds);
    const source: Source = {
      source_id: sourceId,
      source_name: post.source_name,
      source_type: post.source_type,
      source_url: post.source_url,
    };
    sourcesWs.addRow(sourceToRow(source));
  }

  // 6. Write to temp, verify, backup, replace (same as savePost)
  await wb.xlsx.writeFile(tempPath);

  try {
    const verifyWb = new ExcelJS.Workbook();
    await verifyWb.xlsx.readFile(tempPath);
    for (const sheetName of [SHEET_NAMES.POSTS, SHEET_NAMES.COMMENTS, SHEET_NAMES.REPLIES]) {
      if (!verifyWb.getWorksheet(sheetName)) {
        throw new Error(`Verification failed: sheet "${sheetName}" missing`);
      }
    }
  } catch (verifyError) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw new Error(
      `Workbook verification failed. Original file unchanged. ` +
        `Error: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`
    );
  }

  createBackup(wbPath);
  fs.renameSync(tempPath, wbPath);

  return {
    postId: post.post_id,
    commentsWritten: comments.length,
    repliesWritten: replies.length,
    timestamp: post.collection_timestamp,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Remove all rows where a specific column matches a value.
 * ExcelJS doesn't support row deletion cleanly, so we collect rows to remove
 * from bottom to top to avoid index shifting issues.
 */
function removeRowsByPostId(
  ws: ExcelJS.Worksheet,
  columns: string[],
  columnName: string,
  matchValue: string
): void {
  const colIndex = columns.indexOf(columnName) + 1; // 1-indexed for ExcelJS
  if (colIndex === 0) return;

  // Collect row numbers to remove (skip header row 1)
  const rowsToRemove: number[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (String(row.getCell(colIndex).value) === matchValue) {
      rowsToRemove.push(rowNumber);
    }
  });

  // Remove from bottom to top to preserve indices
  for (let i = rowsToRemove.length - 1; i >= 0; i--) {
    ws.spliceRows(rowsToRemove[i], 1);
  }
}
