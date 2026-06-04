import { db, screeningTable } from "@workspace/db";
import { like } from "drizzle-orm";

export async function generateScreeningId(): Promise<string> {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const prefix = `SCR-${dateStr}-`;

  const existing = await db
    .select({ screeningId: screeningTable.screeningId })
    .from(screeningTable)
    .where(like(screeningTable.screeningId, `${prefix}%`));

  const max = existing.reduce((acc, row) => {
    const parts = row.screeningId.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    return isNaN(num) ? acc : Math.max(acc, num);
  }, 0);

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}
