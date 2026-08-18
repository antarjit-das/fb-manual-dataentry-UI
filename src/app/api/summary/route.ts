/**
 * /api/summary — Dataset summary counts for the dashboard.
 *
 * GET: Returns { postCount, commentCount, replyCount, lastSaved }
 */

import { getSummary } from "@/lib/workbook/WorkbookRepository";

export const dynamic = "force-dynamic";

/**
 * GET /api/summary
 * Returns DataSummary for the home page cards.
 */
export async function GET() {
  try {
    const summary = await getSummary();
    return Response.json(summary);
  } catch (error) {
    console.error("[GET /api/summary] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to get summary" },
      { status: 500 }
    );
  }
}
