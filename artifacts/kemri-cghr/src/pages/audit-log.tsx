import { useState } from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const TABLE_OPTIONS = ["screening", "enrolment", "anc_visits", "delivery", "closeout"];

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-800 border-green-200",
  update: "bg-blue-100 text-blue-800 border-blue-200",
  delete: "bg-red-100 text-red-800 border-red-200",
};

export default function AuditLog() {
  const [tableName, setTableName] = useState("");
  const [recordId, setRecordId] = useState("");

  const { data: logs, isLoading } = useListAuditLogs({
    tableName: tableName && tableName !== "all" ? tableName : undefined,
    recordId: recordId || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Audit Log</h1>
        <p className="text-muted-foreground">Complete history of all data changes</p>
      </div>

      <Card className="shadow-sm border-primary/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filter</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by Record ID (e.g. SCR-20260601-001)..."
                className="pl-9"
                value={recordId}
                onChange={e => setRecordId(e.target.value)}
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={tableName} onValueChange={setTableName}>
                <SelectTrigger>
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {TABLE_OPTIONS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Timestamp</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Table</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Record ID</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">By</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.map((log) => (
                    <tr key={log.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="p-4 align-middle text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 align-middle font-mono text-xs">{log.tableName}</td>
                      <td className="p-4 align-middle font-medium text-primary text-xs">{log.recordId}</td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold capitalize ${ACTION_COLORS[log.action] || ""}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="text-xs">{log.userInitials}</Badge>
                      </td>
                      <td className="p-4 align-middle text-xs text-muted-foreground max-w-xs truncate">
                        {log.reasonForChange || <span className="italic opacity-50">—</span>}
                      </td>
                    </tr>
                  ))}
                  {!logs?.length && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">No audit log entries found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
