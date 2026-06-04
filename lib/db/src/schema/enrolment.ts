import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const enrolmentTable = pgTable("enrolment", {
  id: serial("id").primaryKey(),
  screeningId: text("screening_id").notNull().unique(),
  maritalStatus: text("marital_status"),
  husbandName: text("husband_name"),
  village: text("village"),
  education: text("education"),
  occupation: text("occupation"),
  height: real("height"),
  weight: real("weight"),
  temperature: real("temperature"),
  respRate: integer("resp_rate"),
  pulseRate: integer("pulse_rate"),
  bloodPressure: text("blood_pressure"),
  gestationalAge: integer("gestational_age"),
  bmi: real("bmi"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertEnrolmentSchema = createInsertSchema(enrolmentTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEnrolment = z.infer<typeof insertEnrolmentSchema>;
export type Enrolment = typeof enrolmentTable.$inferSelect;
