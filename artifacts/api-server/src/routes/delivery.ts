import { Router, type IRouter } from "express";
import { db, deliveryTable, enrolmentTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireDataManager } from "../lib/auth";
import { logAudit } from "../lib/audit";
import {
  CreateDeliveryBody,
  GetDeliveryParams,
  UpdateDeliveryParams,
  UpdateDeliveryBody,
  DeleteDeliveryParams,
  DeleteDeliveryBody,
} from "@workspace/api-zod";
import type { AuthPayload } from "../lib/auth";

const router: IRouter = Router();
type AuthReq = typeof import("express").request & { user: AuthPayload };

router.get("/delivery", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(deliveryTable).orderBy(deliveryTable.createdAt);
  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    }))
  );
});

router.post("/delivery", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const parsed = CreateDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [enrolled] = await db
    .select()
    .from(enrolmentTable)
    .where(eq(enrolmentTable.screeningId, parsed.data.screeningId));

  if (!enrolled) {
    res.status(400).json({ error: "Participant must be enrolled before delivery record" });
    return;
  }

  const data = parsed.data;
  let bmi: number | null = null;
  if (enrolled.height && data.motherWeight && enrolled.height > 0) {
    const hm = enrolled.height / 100;
    bmi = Math.round((data.motherWeight / (hm * hm)) * 10) / 10;
  }

  const [record] = await db
    .insert(deliveryTable)
    .values({
      screeningId: data.screeningId,
      motherWeight: data.motherWeight ?? null,
      temperature: data.temperature ?? null,
      respRate: data.respRate ?? null,
      pulseRate: data.pulseRate ?? null,
      bloodPressure: data.bloodPressure ?? null,
      oxygenSaturation: data.oxygenSaturation ?? null,
      bmi,
      physicalAbnormality: data.physicalAbnormality ?? null,
      abnormalityDetails: data.abnormalityDetails ?? null,
      deliveryDate: data.deliveryDate ?? null,
      deliveryTime: data.deliveryTime ?? null,
      deliveryPlace: data.deliveryPlace ?? null,
      deliveredBy: data.deliveredBy ?? null,
      deliveryMode: data.deliveryMode ?? null,
      csectionIndication: data.csectionIndication ?? null,
      createdBy: user.initials,
    })
    .returning();

  await logAudit({
    tableName: "delivery",
    recordId: data.screeningId,
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

router.get("/delivery/:screeningId", requireAuth, async (req, res): Promise<void> => {
  const params = GetDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db
    .select()
    .from(deliveryTable)
    .where(eq(deliveryTable.screeningId, params.data.screeningId));

  if (!record) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }

  res.json({
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
  });
});

router.patch("/delivery/:screeningId", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const params = UpdateDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(deliveryTable)
    .where(eq(deliveryTable.screeningId, params.data.screeningId));

  if (!existing) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }

  const { reason, ...updateData } = parsed.data;

  const [updated] = await db
    .update(deliveryTable)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(deliveryTable.screeningId, params.data.screeningId))
    .returning();

  await logAudit({
    tableName: "delivery",
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

router.delete("/delivery/:screeningId", requireAuth, requireDataManager, async (req, res): Promise<void> => {
  const user = (req as unknown as AuthReq).user;
  const params = DeleteDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = DeleteDeliveryBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.reason) {
    res.status(400).json({ error: "Reason for deletion is required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(deliveryTable)
    .where(eq(deliveryTable.screeningId, params.data.screeningId));

  if (!existing) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }

  await db.delete(deliveryTable).where(eq(deliveryTable.screeningId, params.data.screeningId));

  await logAudit({
    tableName: "delivery",
    recordId: params.data.screeningId,
    action: "DELETE",
    oldValue: existing,
    reasonForChange: parsed.data.reason,
    userInitials: user.initials,
  });

  res.json({ ok: true });
});

export default router;
