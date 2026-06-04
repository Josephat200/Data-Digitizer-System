import { Router, type IRouter } from "express";
import { db, enrolmentTable, screeningTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireDataManager } from "../lib/auth";
import { logAudit } from "../lib/audit";
import {
  CreateEnrolmentBody,
  GetEnrolmentParams,
  UpdateEnrolmentParams,
  UpdateEnrolmentBody,
  DeleteEnrolmentParams,
  DeleteEnrolmentBody,
  ListEnrolmentsQueryParams,
} from "@workspace/api-zod";
import type { AuthPayload } from "../lib/auth";

const router: IRouter = Router();
type AuthReq = typeof import("express").request & { user: AuthPayload };

router.get("/enrolment/enrolled", requireAuth, async (_req, res): Promise<void> => {
  const enrolled = await db
    .select({
      screeningId: enrolmentTable.screeningId,
      healthFacility: screeningTable.healthFacility,
      interviewDate: screeningTable.interviewDate,
    })
    .from(enrolmentTable)
    .leftJoin(screeningTable, eq(enrolmentTable.screeningId, screeningTable.screeningId));

  res.json(
    enrolled.map((e) => ({
      screeningId: e.screeningId,
      healthFacility: e.healthFacility ?? "",
      interviewDate: e.interviewDate ?? null,
    }))
  );
});

router.get("/enrolment", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListEnrolmentsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let rows = await db.select().from(enrolmentTable).orderBy(enrolmentTable.createdAt);

  if (params.facility) {
    const all = await db
      .select({ enrolment: enrolmentTable, facility: screeningTable.healthFacility })
      .from(enrolmentTable)
      .leftJoin(screeningTable, eq(enrolmentTable.screeningId, screeningTable.screeningId));
    rows = all
      .filter((r) => r.facility === params.facility)
      .map((r) => r.enrolment);
  }

  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    }))
  );
});

router.post("/enrolment", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const parsed = CreateEnrolmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { screeningId } = parsed.data;

  const [screening] = await db
    .select()
    .from(screeningTable)
    .where(eq(screeningTable.screeningId, screeningId));

  if (!screening) {
    res.status(404).json({ error: "Screening not found" });
    return;
  }
  if (screening.eligible !== "Yes" || screening.consented !== "Yes") {
    res.status(400).json({ error: "Participant must be eligible and consented" });
    return;
  }

  const [existing] = await db
    .select()
    .from(enrolmentTable)
    .where(eq(enrolmentTable.screeningId, screeningId));
  if (existing) {
    res.status(400).json({ error: "Participant already enrolled" });
    return;
  }

  const data = parsed.data;
  let bmi: number | null = null;
  if (data.height && data.weight && data.height > 0) {
    const hm = data.height / 100;
    bmi = Math.round((data.weight / (hm * hm)) * 10) / 10;
  }

  const [record] = await db
    .insert(enrolmentTable)
    .values({
      screeningId,
      maritalStatus: data.maritalStatus ?? null,
      husbandName: data.husbandName ?? null,
      village: data.village ?? null,
      education: data.education ?? null,
      occupation: data.occupation ?? null,
      height: data.height ?? null,
      weight: data.weight ?? null,
      temperature: data.temperature ?? null,
      respRate: data.respRate ?? null,
      pulseRate: data.pulseRate ?? null,
      bloodPressure: data.bloodPressure ?? null,
      gestationalAge: data.gestationalAge ?? null,
      bmi,
      createdBy: user.initials,
    })
    .returning();

  await logAudit({
    tableName: "enrolment",
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

router.get("/enrolment/:screeningId", requireAuth, async (req, res): Promise<void> => {
  const params = GetEnrolmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db
    .select()
    .from(enrolmentTable)
    .where(eq(enrolmentTable.screeningId, params.data.screeningId));

  if (!record) {
    res.status(404).json({ error: "Enrolment not found" });
    return;
  }

  res.json({
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
  });
});

router.patch("/enrolment/:screeningId", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const params = UpdateEnrolmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEnrolmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(enrolmentTable)
    .where(eq(enrolmentTable.screeningId, params.data.screeningId));

  if (!existing) {
    res.status(404).json({ error: "Enrolment not found" });
    return;
  }

  const { reason, ...updateData } = parsed.data;

  const height = updateData.height ?? existing.height;
  const weight = updateData.weight ?? existing.weight;
  let bmi: number | undefined = undefined;
  if (height && weight && height > 0) {
    const hm = height / 100;
    bmi = Math.round((weight / (hm * hm)) * 10) / 10;
  }

  const [updated] = await db
    .update(enrolmentTable)
    .set({ ...updateData, ...(bmi !== undefined ? { bmi } : {}), updatedAt: new Date() })
    .where(eq(enrolmentTable.screeningId, params.data.screeningId))
    .returning();

  await logAudit({
    tableName: "enrolment",
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

router.delete("/enrolment/:screeningId", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const params = DeleteEnrolmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = DeleteEnrolmentBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.reason) {
    res.status(400).json({ error: "Reason for deletion is required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(enrolmentTable)
    .where(eq(enrolmentTable.screeningId, params.data.screeningId));

  if (!existing) {
    res.status(404).json({ error: "Enrolment not found" });
    return;
  }

  await db.delete(enrolmentTable).where(eq(enrolmentTable.screeningId, params.data.screeningId));

  await logAudit({
    tableName: "enrolment",
    recordId: params.data.screeningId,
    action: "DELETE",
    oldValue: existing,
    reasonForChange: parsed.data.reason,
    userInitials: user.initials,
  });

  res.json({ ok: true });
});

export default router;
