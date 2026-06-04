import { pgTable, text, serial, timestamp, real, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deliveryTable = pgTable("delivery", {
  id: serial("id").primaryKey(),
  screeningId: text("screening_id").notNull().unique(),
  motherWeight: real("mother_weight"),
  temperature: real("temperature"),
  respRate: integer("resp_rate"),
  pulseRate: integer("pulse_rate"),
  bloodPressure: text("blood_pressure"),
  oxygenSaturation: real("oxygen_saturation"),
  bmi: real("bmi"),
  physicalAbnormality: text("physical_abnormality"),
  abnormalityDetails: text("abnormality_details"),
  deliveryDate: date("delivery_date", { mode: "string" }),
  deliveryTime: text("delivery_time"),
  deliveryPlace: text("delivery_place"),
  deliveredBy: text("delivered_by"),
  deliveryMode: text("delivery_mode"),
  csectionIndication: text("csection_indication"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertDeliverySchema = createInsertSchema(deliveryTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveryTable.$inferSelect;
