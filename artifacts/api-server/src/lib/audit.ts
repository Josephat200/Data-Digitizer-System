import { db, auditLogsTable } from "@workspace/db";

export async function logAudit({
  tableName,
  recordId,
  action,
  oldValue,
  newValue,
  reasonForChange,
  userInitials,
}: {
  tableName: string;
  recordId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  oldValue?: unknown;
  newValue?: unknown;
  reasonForChange?: string;
  userInitials: string;
}): Promise<void> {
  await db.insert(auditLogsTable).values({
    tableName,
    recordId,
    action,
    oldValue: oldValue != null ? JSON.stringify(oldValue) : null,
    newValue: newValue != null ? JSON.stringify(newValue) : null,
    reasonForChange: reasonForChange ?? null,
    userInitials,
  });
}
