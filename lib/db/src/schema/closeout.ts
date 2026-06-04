import { pgTable, text, serial, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const closeoutTable = pgTable("closeout", {
  id: serial("id").primaryKey(),
  screeningId: text("screening_id").notNull().unique(),
  terminationDate: date("termination_date", { mode: "string" }).notNull(),
  participantStatus: text("participant_status").notNull(),
  discontinuationReason: text("discontinuation_reason"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCloseoutSchema = createInsertSchema(closeoutTable).omit({ id: true, createdAt: true });
export type InsertCloseout = z.infer<typeof insertCloseoutSchema>;
export type Closeout = typeof closeoutTable.$inferSelect;
