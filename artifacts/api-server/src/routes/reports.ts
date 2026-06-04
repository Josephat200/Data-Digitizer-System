import { Router, type IRouter } from "express";
import { db, screeningTable, enrolmentTable, ancVisitsTable, deliveryTable, closeoutTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { eq, isNull } from "drizzle-orm";

const router: IRouter = Router();

router.get("/reports/summary", requireAuth, async (_req, res): Promise<void> => {
  const [screened, enrolled, ancVisits, deliveries, closeouts] = await Promise.all([
    db.select({ screeningId: screeningTable.screeningId }).from(screeningTable),
    db.select({ id: enrolmentTable.id }).from(enrolmentTable),
    db.select({ id: ancVisitsTable.id }).from(ancVisitsTable),
    db.select({ id: deliveryTable.id }).from(deliveryTable),
    db.select({ id: closeoutTable.id }).from(closeoutTable),
  ]);

  res.json({
    screened: screened.length,
    enrolled: enrolled.length,
    ancVisits: ancVisits.length,
    deliveries: deliveries.length,
    closeouts: closeouts.length,
  });
});

router.get("/reports/site-summary", requireAuth, async (_req, res): Promise<void> => {
  const facilities = ["Bondo", "Siaya", "Kuoyo", "Lumumba"];

  const [screenings, enrolments, deliveries] = await Promise.all([
    db.select({ screeningId: screeningTable.screeningId, healthFacility: screeningTable.healthFacility }).from(screeningTable),
    db.select({ screeningId: enrolmentTable.screeningId }).from(enrolmentTable),
    db.select({ screeningId: deliveryTable.screeningId }).from(deliveryTable),
  ]);

  const enrolledSet = new Set(enrolments.map((e) => e.screeningId));
  const deliverySet = new Set(deliveries.map((d) => d.screeningId));

  const result = facilities.map((facility) => {
    const facilityScreenings = screenings.filter((s) => s.healthFacility === facility);
    const screened = facilityScreenings.length;
    const enrolled = facilityScreenings.filter((s) => enrolledSet.has(s.screeningId)).length;
    const delivs = facilityScreenings.filter((s) => deliverySet.has(s.screeningId)).length;
    return { facility, screened, enrolled, deliveries: delivs };
  });

  res.json(result);
});

router.get("/reports/data-quality", requireAuth, async (_req, res): Promise<void> => {
  const screenings = await db.select().from(screeningTable);
  const deliveries = await db.select().from(deliveryTable);

  const enrolled = await db.select({ screeningId: enrolmentTable.screeningId }).from(enrolmentTable);
  const enrolledIds = new Set(enrolled.map((e) => e.screeningId));

  const missingDob = screenings.filter((s) => !s.dob).map((s) => s.screeningId);
  const missingWeight = screenings.filter((s) => s.weight == null).map((s) => s.screeningId);
  const missingBp = screenings.filter((s) => !s.bloodPressure).map((s) => s.screeningId);
  const bmiUnder15 = screenings.filter((s) => s.bmi != null && s.bmi < 15).map((s) => s.screeningId);
  const bmiOver45 = screenings.filter((s) => s.bmi != null && s.bmi > 45).map((s) => s.screeningId);
  const missingConsent = screenings.filter((s) => !s.consented).map((s) => s.screeningId);
  const missingDeliveryDate = deliveries.filter((d) => !d.deliveryDate).map((d) => d.screeningId);

  res.json({
    missingDob,
    missingWeight,
    missingBp,
    bmiUnder15,
    bmiOver45,
    missingConsent,
    missingDeliveryDate,
  });
});

router.get("/reports/reminders", requireAuth, async (_req, res): Promise<void> => {
  const today = new Date();
  const reminders: Array<{
    screeningId: string;
    type: string;
    dueDate: string;
    message: string;
    healthFacility: string | null;
  }> = [];

  // ANC visits: find enrolled participants and check their latest ANC visit
  const enrolments = await db
    .select({
      screeningId: enrolmentTable.screeningId,
      gestationalAge: enrolmentTable.gestationalAge,
    })
    .from(enrolmentTable);

  const screenings = await db
    .select({ screeningId: screeningTable.screeningId, healthFacility: screeningTable.healthFacility })
    .from(screeningTable);

  const facilityMap = new Map(screenings.map((s) => [s.screeningId, s.healthFacility]));

  const ancVisits = await db
    .select()
    .from(ancVisitsTable)
    .orderBy(ancVisitsTable.visitDate);

  const deliveries = await db
    .select({ screeningId: deliveryTable.screeningId })
    .from(deliveryTable);
  const deliveredIds = new Set(deliveries.map((d) => d.screeningId));

  for (const enrolment of enrolments) {
    if (deliveredIds.has(enrolment.screeningId)) continue;

    const visits = ancVisits.filter((v) => v.screeningId === enrolment.screeningId);

    // Check if due for delivery (>36 weeks gestational age)
    if (enrolment.gestationalAge != null && enrolment.gestationalAge >= 36) {
      reminders.push({
        screeningId: enrolment.screeningId,
        type: "delivery",
        dueDate: today.toISOString().split("T")[0],
        message: `Participant at ${enrolment.gestationalAge} weeks — delivery expected`,
        healthFacility: facilityMap.get(enrolment.screeningId) ?? null,
      });
      continue;
    }

    // Check next ANC appointment
    const lastVisit = visits[visits.length - 1];
    if (lastVisit?.nextAppointment) {
      const nextDate = new Date(lastVisit.nextAppointment);
      const diffDays = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        reminders.push({
          screeningId: enrolment.screeningId,
          type: "anc",
          dueDate: lastVisit.nextAppointment,
          message: `ANC visit ${diffDays < 0 ? "overdue" : `due in ${diffDays} day(s)`}`,
          healthFacility: facilityMap.get(enrolment.screeningId) ?? null,
        });
      }
    } else if (visits.length === 0) {
      // No ANC visits yet — enrolled but never attended
      reminders.push({
        screeningId: enrolment.screeningId,
        type: "anc",
        dueDate: today.toISOString().split("T")[0],
        message: "No ANC visits recorded — first visit overdue",
        healthFacility: facilityMap.get(enrolment.screeningId) ?? null,
      });
    }
  }

  res.json(reminders);
});

export default router;
