import { Router, type IRouter } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { ListAuditLogsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/audit", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListAuditLogsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let rows = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.timestamp));

  if (params.tableName) {
    rows = rows.filter((r) => r.tableName === params.tableName);
  }
  if (params.recordId) {
    rows = rows.filter((r) => r.recordId === params.recordId);
  }

  res.json(
    rows.map((r) => ({
      ...r,
      timestamp: r.timestamp.toISOString(),
    }))
  );
});

export default router;
