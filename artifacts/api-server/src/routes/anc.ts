import { Router, type IRouter } from "express";
import { db, ancVisitsTable, enrolmentTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireDataManager } from "../lib/auth";
import { logAudit } from "../lib/audit";
import {
  CreateAncVisitBody,
  GetAncVisitParams,
  UpdateAncVisitParams,
  UpdateAncVisitBody,
  DeleteAncVisitParams,
  DeleteAncVisitBody,
  ListAncVisitsQueryParams,
} from "@workspace/api-zod";
import type { AuthPayload } from "../lib/auth";

const router: IRouter = Router();
type AuthReq = typeof import("express").request & { user: AuthPayload };

router.get("/anc", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListAncVisitsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let rows = await db.select().from(ancVisitsTable).orderBy(ancVisitsTable.createdAt);

  if (params.screeningId) {
    rows = rows.filter((r) => r.screeningId === params.screeningId);
  }

  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/anc", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const parsed = CreateAncVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Validate participant is enrolled
  const [enrolled] = await db
    .select()
    .from(enrolmentTable)
    .where(eq(enrolmentTable.screeningId, parsed.data.screeningId));

  if (!enrolled) {
    res.status(400).json({ error: "Participant must be enrolled before ANC visits" });
    return;
  }

  const data = parsed.data;
  const [record] = await db
    .insert(ancVisitsTable)
    .values({
      screeningId: data.screeningId,
      visitNumber: data.visitNumber,
      visitDate: data.visitDate,
      gestationalAge: data.gestationalAge ?? null,
      weight: data.weight ?? null,
      bp: data.bp ?? null,
      fundalHeight: data.fundalHeight ?? null,
      muac: data.muac ?? null,
      complaints: data.complaints ?? null,
      medication: data.medication ?? null,
      nextAppointment: data.nextAppointment ?? null,
      createdBy: user.initials,
    })
    .returning();

  await logAudit({
    tableName: "anc_visits",
    recordId: String(record.id),
    action: "CREATE",
    newValue: record,
    userInitials: user.initials,
  });

  res.status(201).json({
    ...record,
    createdAt: record.createdAt.toISOString(),
  });
});

router.get("/anc/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetAncVisitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db
    .select()
    .from(ancVisitsTable)
    .where(eq(ancVisitsTable.id, params.data.id));

  if (!record) {
    res.status(404).json({ error: "ANC visit not found" });
    return;
  }

  res.json({ ...record, createdAt: record.createdAt.toISOString() });
});

router.patch("/anc/:id", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const params = UpdateAncVisitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAncVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(ancVisitsTable)
    .where(eq(ancVisitsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "ANC visit not found" });
    return;
  }

  const { reason, ...updateData } = parsed.data;

  const [updated] = await db
    .update(ancVisitsTable)
    .set(updateData)
    .where(eq(ancVisitsTable.id, params.data.id))
    .returning();

  await logAudit({
    tableName: "anc_visits",
    recordId: String(params.data.id),
    action: "UPDATE",
    oldValue: existing,
    newValue: updated,
    reasonForChange: reason,
    userInitials: user.initials,
  });

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/anc/:id", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const params = DeleteAncVisitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = DeleteAncVisitBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.reason) {
    res.status(400).json({ error: "Reason for deletion is required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(ancVisitsTable)
    .where(eq(ancVisitsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "ANC visit not found" });
    return;
  }

  await db.delete(ancVisitsTable).where(eq(ancVisitsTable.id, params.data.id));

  await logAudit({
    tableName: "anc_visits",
    recordId: String(params.data.id),
    action: "DELETE",
    oldValue: existing,
    reasonForChange: parsed.data.reason,
    userInitials: user.initials,
  });

  res.json({ ok: true });
});

export default router;
