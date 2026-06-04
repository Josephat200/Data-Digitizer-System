import { pgTable, text, serial, timestamp, real, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const screeningTable = pgTable("screening", {
  screeningId: text("screening_id").primaryKey(),
  interviewDate: date("interview_date", { mode: "string" }).notNull(),
  healthFacility: text("health_facility").notNull(),
  dob: date("dob", { mode: "string" }),
  ageYears: integer("age_years"),
  ageMonths: integer("age_months"),
  height: real("height"),
  weight: real("weight"),
  temperature: real("temperature"),
  respRate: integer("resp_rate"),
  pulseRate: integer("pulse_rate"),
  bloodPressure: text("blood_pressure"),
  lmp: date("lmp", { mode: "string" }),
  fundalHeight: real("fundal_height"),
  inclusion1: text("inclusion_1"),
  inclusion2: text("inclusion_2"),
  inclusion3: text("inclusion_3"),
  inclusion4: text("inclusion_4"),
  inclusion5: text("inclusion_5"),
  exclusion1: text("exclusion_1"),
  exclusion2: text("exclusion_2"),
  exclusion3: text("exclusion_3"),
  eligible: text("eligible"),
  consented: text("consented"),
  bmi: real("bmi"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertScreeningSchema = createInsertSchema(screeningTable).omit({ createdAt: true, updatedAt: true });
export type InsertScreening = z.infer<typeof insertScreeningSchema>;
export type Screening = typeof screeningTable.$inferSelect;
