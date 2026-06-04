import { Router, type IRouter } from "express";
import { db, closeoutTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireDataManager } from "../lib/auth";
import { logAudit } from "../lib/audit";
import {
  CreateCloseoutBody,
  GetCloseoutParams,
  UpdateCloseoutParams,
  UpdateCloseoutBody,
  DeleteCloseoutParams,
  DeleteCloseoutBody,
} from "@workspace/api-zod";
import type { AuthPayload } from "../lib/auth";

const router: IRouter = Router();
type AuthReq = typeof import("express").request & { user: AuthPayload };

router.get("/closeout", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(closeoutTable).orderBy(closeoutTable.createdAt);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/closeout", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const parsed = CreateCloseoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [record] = await db
    .insert(closeoutTable)
    .values({
      screeningId: data.screeningId,
      terminationDate: data.terminationDate,
      participantStatus: data.participantStatus,
      discontinuationReason: data.discontinuationReason ?? null,
      createdBy: user.initials,
    })
    .returning();

  await logAudit({
    tableName: "closeout",
    recordId: data.screeningId,
    action: "CREATE",
    newValue: record,
    userInitials: user.initials,
  });

  res.status(201).json({ ...record, createdAt: record.createdAt.toISOString() });
});

router.get("/closeout/:screeningId", requireAuth, async (req, res): Promise<void> => {
  const params = GetCloseoutParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db
    .select()
    .from(closeoutTable)
    .where(eq(closeoutTable.screeningId, params.data.screeningId));

  if (!record) {
    res.status(404).json({ error: "Closeout not found" });
    return;
  }

  res.json({ ...record, createdAt: record.createdAt.toISOString() });
});

router.patch("/closeout/:screeningId", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const params = UpdateCloseoutParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCloseoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(closeoutTable)
    .where(eq(closeoutTable.screeningId, params.data.screeningId));

  if (!existing) {
    res.status(404).json({ error: "Closeout not found" });
    return;
  }

  const { reason, ...updateData } = parsed.data;

  const [updated] = await db
    .update(closeoutTable)
    .set(updateData)
    .where(eq(closeoutTable.screeningId, params.data.screeningId))
    .returning();

  await logAudit({
    tableName: "closeout",
    recordId: params.data.screeningId,
    action: "UPDATE",
    oldValue: existing,
    newValue: updated,
    reasonForChange: reason,
    userInitials: user.initials,
  });

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/closeout/:screeningId", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const params = DeleteCloseoutParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = DeleteCloseoutBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.reason) {
    res.status(400).json({ error: "Reason for deletion is required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(closeoutTable)
    .where(eq(closeoutTable.screeningId, params.data.screeningId));

  if (!existing) {
    res.status(404).json({ error: "Closeout not found" });
    return;
  }

  await db.delete(closeoutTable).where(eq(closeoutTable.screeningId, params.data.screeningId));

  await logAudit({
    tableName: "closeout",
    recordId: params.data.screeningId,
    action: "DELETE",
    oldValue: existing,
    reasonForChange: parsed.data.reason,
    userInitials: user.initials,
  });

  res.json({ ok: true });
});

export default router;
