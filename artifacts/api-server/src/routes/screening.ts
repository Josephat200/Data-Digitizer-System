import { Router, type IRouter } from "express";
import { db, screeningTable, enrolmentTable } from "@workspace/db";
import { eq, like, and, or } from "drizzle-orm";
import { requireAuth, requireDataManager } from "../lib/auth";
import { logAudit } from "../lib/audit";
import { generateScreeningId } from "../lib/screeningId";
import {
  CreateScreeningBody,
  UpdateScreeningParams,
  UpdateScreeningBody,
  DeleteScreeningParams,
  DeleteScreeningBody,
  GetScreeningParams,
  ListScreeningsQueryParams,
} from "@workspace/api-zod";
import type { AuthPayload } from "../lib/auth";

const router: IRouter = Router();

type AuthReq = typeof import("express").request & { user: AuthPayload };

router.get("/screening/eligible", requireAuth, async (_req, res): Promise<void> => {
  const eligible = await db
    .select({
      screeningId: screeningTable.screeningId,
      healthFacility: screeningTable.healthFacility,
      interviewDate: screeningTable.interviewDate,
    })
    .from(screeningTable)
    .where(and(eq(screeningTable.eligible, "Yes"), eq(screeningTable.consented, "Yes")));

  // Only those not yet enrolled
  const enrolled = await db.select({ screeningId: enrolmentTable.screeningId }).from(enrolmentTable);
  const enrolledIds = new Set(enrolled.map((e) => e.screeningId));
  const result = eligible.filter((s) => !enrolledIds.has(s.screeningId));
  res.json(result);
});

router.get("/screening", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListScreeningsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let rows = await db.select().from(screeningTable).orderBy(screeningTable.createdAt);

  if (params.facility) {
    rows = rows.filter((r) => r.healthFacility === params.facility);
  }
  if (params.eligible) {
    rows = rows.filter((r) => r.eligible === params.eligible);
  }
  if (params.search) {
    const s = params.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.screeningId.toLowerCase().includes(s) ||
        r.healthFacility.toLowerCase().includes(s)
    );
  }

  const result = rows.map((r) => ({
    ...r,
    interviewDate: r.interviewDate ?? "",
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
  }));
  res.json(result);
});

router.post("/screening", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const parsed = CreateScreeningBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const screeningId = await generateScreeningId();
  const data = parsed.data;

  // Auto-calculate BMI
  let bmi: number | null = null;
  if (data.height && data.weight && data.height > 0) {
    const heightM = data.height / 100;
    bmi = Math.round((data.weight / (heightM * heightM)) * 10) / 10;
  }

  const [record] = await db
    .insert(screeningTable)
    .values({
      screeningId,
      interviewDate: data.interviewDate,
      healthFacility: data.healthFacility,
      dob: data.dob ?? null,
      ageYears: data.ageYears ?? null,
      ageMonths: data.ageMonths ?? null,
      height: data.height ?? null,
      weight: data.weight ?? null,
      temperature: data.temperature ?? null,
      respRate: data.respRate ?? null,
      pulseRate: data.pulseRate ?? null,
      bloodPressure: data.bloodPressure ?? null,
      lmp: data.lmp ?? null,
      fundalHeight: data.fundalHeight ?? null,
      inclusion1: data.inclusion1 ?? null,
      inclusion2: data.inclusion2 ?? null,
      inclusion3: data.inclusion3 ?? null,
      inclusion4: data.inclusion4 ?? null,
      inclusion5: data.inclusion5 ?? null,
      exclusion1: data.exclusion1 ?? null,
      exclusion2: data.exclusion2 ?? null,
      exclusion3: data.exclusion3 ?? null,
      eligible: data.eligible ?? null,
      consented: data.consented ?? null,
      bmi,
      createdBy: user.initials,
    })
    .returning();

  await logAudit({
    tableName: "screening",
    recordId: screeningId,
    action: "CREATE",
    newValue: record,
    userInitials: user.initials,
  });

  res.status(201).json({
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
  });
});

router.get("/screening/:screeningId", requireAuth, async (req, res): Promise<void> => {
  const params = GetScreeningParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db
    .select()
    .from(screeningTable)
    .where(eq(screeningTable.screeningId, params.data.screeningId));

  if (!record) {
    res.status(404).json({ error: "Screening not found" });
    return;
  }

  res.json({
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
  });
});

router.patch("/screening/:screeningId", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const params = UpdateScreeningParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateScreeningBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(screeningTable)
    .where(eq(screeningTable.screeningId, params.data.screeningId));

  if (!existing) {
    res.status(404).json({ error: "Screening not found" });
    return;
  }

  const { reason, ...updateData } = parsed.data;

  // Recalculate BMI if relevant fields change
  const height = updateData.height ?? existing.height;
  const weight = updateData.weight ?? existing.weight;
  let bmi: number | undefined = undefined;
  if (height && weight && height > 0) {
    const hm = height / 100;
    bmi = Math.round((weight / (hm * hm)) * 10) / 10;
  }

  const [updated] = await db
    .update(screeningTable)
    .set({ ...updateData, ...(bmi !== undefined ? { bmi } : {}), updatedAt: new Date() })
    .where(eq(screeningTable.screeningId, params.data.screeningId))
    .returning();

  await logAudit({
    tableName: "screening",
    recordId: params.data.screeningId,
    action: "UPDATE",
    oldValue: existing,
    newValue: updated,
    reasonForChange: reason,
    userInitials: user.initials,
  });

  res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : null,
  });
});

router.delete("/screening/:screeningId", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const params = DeleteScreeningParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = DeleteScreeningBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.reason) {
    res.status(400).json({ error: "Reason for deletion is required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(screeningTable)
    .where(eq(screeningTable.screeningId, params.data.screeningId));

  if (!existing) {
    res.status(404).json({ error: "Screening not found" });
    return;
  }

  await db.delete(screeningTable).where(eq(screeningTable.screeningId, params.data.screeningId));

  await logAudit({
    tableName: "screening",
    recordId: params.data.screeningId,
    action: "DELETE",
    oldValue: existing,
    reasonForChange: parsed.data.reason,
    userInitials: user.initials,
  });

  res.json({ ok: true });
});

export default router;
