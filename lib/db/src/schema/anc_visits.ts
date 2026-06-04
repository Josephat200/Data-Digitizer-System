import { pgTable, text, serial, timestamp, real, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ancVisitsTable = pgTable("anc_visits", {
  id: serial("id").primaryKey(),
  screeningId: text("screening_id").notNull(),
  visitNumber: integer("visit_number").notNull(),
  visitDate: date("visit_date", { mode: "string" }).notNull(),
  gestationalAge: integer("gestational_age"),
  weight: real("weight"),
  bp: text("bp"),
  fundalHeight: real("fundal_height"),
  muac: real("muac"),
  complaints: text("complaints"),
  medication: text("medication"),
  nextAppointment: date("next_appointment", { mode: "string" }),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAncVisitSchema = createInsertSchema(ancVisitsTable).omit({ id: true, createdAt: true });
export type InsertAncVisit = z.infer<typeof insertAncVisitSchema>;
export type AncVisit = typeof ancVisitsTable.$inferSelect;
