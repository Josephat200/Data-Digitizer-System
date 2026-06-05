import { useState } from "react";
import { Link } from "wouter";
import { useListCloseouts, type Closeout } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileX, Download, Printer, Plus } from "lucide-react";
import { downloadCsv, todayStamp } from "@/lib/export";
import { NewRecordDialog } from "@/components/new-record-dialog";

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-muted-foreground/50 italic text-xs">—</span>;
  const cls = status.startsWith("Completed")
    ? "bg-green-100 text-green-800 border-green-200"
    : status === "Deceased"
    ? "bg-red-100 text-red-800 border-red-200"
    : "bg-orange-100 text-orange-800 border-orange-200";
  return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}

export default function CloseoutList() {
  const [search, setSearch] = useState("");
  const { data: closeouts, isLoading } = useListCloseouts({});

  const filtered = (closeouts ?? []).filter((c: Closeout) =>
    !search || c.screeningId.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    downloadCsv(`KEMRI_CGHR_Closeouts_${todayStamp()}.csv`, filtered as Record<string, unknown>[], [
      { key: "screeningId", label: "Screening ID" },
      { key: "terminationDate", label: "Termination Date" },
      { key: "participantStatus", label: "Participant Status" },
      { key: "discontinuationReason", label: "Discontinuation Reason" },
      { key: "createdBy", label: "Recorded By" },
      { key: "createdAt", label: "Created At" },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Closeouts</h1>
          <p className="text-muted-foreground text-sm">All participant closeout records</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">{closeouts?.length ?? 0} total</Badge>
          <Button variant="outline" size="sm" className="no-print" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          <Button variant="outline" size="sm" className="no-print" onClick={handleExport} disabled={!filtered.length}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <NewRecordDialog
            type="closeout"
            trigger={
              <Button size="sm" className="no-print font-semibold">
                <Plus className="w-4 h-4 mr-2" />New Closeout
              </Button>
            }
          />
        </div>
      </div>

      {/* Print header */}
      <div className="print-header hidden">
        <p className="text-xs text-gray-500">KEMRI-CGHR Influenza Program CDMS &nbsp;·&nbsp; Closeouts &nbsp;·&nbsp; Printed: {new Date().toLocaleString()}</p>
      </div>

      <div className="relative max-w-sm no-print">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by Screening ID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <div className="grid grid-cols-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Screening ID</span>
            <span>Termination Date</span>
            <span>Status</span>
            <span>Recorded By</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b"><Skeleton className="h-4 w-full" /></div>
            ))
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <FileX className="w-8 h-8 opacity-30" />
              <p>{search ? "No matching records." : "No closeout records yet."}</p>
            </div>
          ) : (
            filtered.map((c: Closeout) => (
              <Link key={c.screeningId} href={`/screening/${c.screeningId}`}>
                <div className="grid grid-cols-4 px-4 py-3 border-b last:border-0 hover:bg-muted/40 cursor-pointer text-sm transition-colors">
                  <span className="font-medium text-primary">{c.screeningId}</span>
                  <span>{c.terminationDate ?? <span className="text-muted-foreground/50 italic">—</span>}</span>
                  <StatusBadge status={c.participantStatus} />
                  <span className="text-muted-foreground">{c.createdBy}</span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
