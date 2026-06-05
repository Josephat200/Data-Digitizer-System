import { useState } from "react";
import { Link } from "wouter";
import { useListEnrolments, type Enrolment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ClipboardList, Download, Printer, Plus } from "lucide-react";
import { downloadCsv, todayStamp } from "@/lib/export";
import { NewRecordDialog } from "@/components/new-record-dialog";

export default function EnrolmentList() {
  const [search, setSearch] = useState("");
  const { data: enrolments, isLoading } = useListEnrolments({});

  const filtered = (enrolments ?? []).filter((e: Enrolment) =>
    !search || e.screeningId.toLowerCase().includes(search.toLowerCase()) ||
    (e.village ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    downloadCsv(`KEMRI_CGHR_Enrolments_${todayStamp()}.csv`, filtered as Record<string, unknown>[], [
      { key: "screeningId", label: "Screening ID" },
      { key: "maritalStatus", label: "Marital Status" },
      { key: "husbandName", label: "Husband Name" },
      { key: "village", label: "Village" },
      { key: "education", label: "Education" },
      { key: "occupation", label: "Occupation" },
      { key: "gestationalAge", label: "Gestational Age (wks)" },
      { key: "height", label: "Height (cm)" },
      { key: "weight", label: "Weight (kg)" },
      { key: "bmi", label: "BMI" },
      { key: "temperature", label: "Temperature (°C)" },
      { key: "respRate", label: "Resp Rate (/min)" },
      { key: "pulseRate", label: "Pulse Rate (/min)" },
      { key: "bloodPressure", label: "Blood Pressure" },
      { key: "createdBy", label: "Recorded By" },
      { key: "createdAt", label: "Created At" },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Enrolments</h1>
          <p className="text-muted-foreground text-sm">All enrolled participants</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">{enrolments?.length ?? 0} total</Badge>
          <Button variant="outline" size="sm" className="no-print" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          <Button variant="outline" size="sm" className="no-print" onClick={handleExport} disabled={!filtered.length}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <NewRecordDialog
            type="enrolment"
            trigger={
              <Button size="sm" className="no-print font-semibold">
                <Plus className="w-4 h-4 mr-2" />New Enrolment
              </Button>
            }
          />
        </div>
      </div>

      {/* Print header */}
      <div className="print-header hidden">
        <p className="text-xs text-gray-500">KEMRI-CGHR Influenza Program CDMS &nbsp;·&nbsp; Enrolments &nbsp;·&nbsp; Printed: {new Date().toLocaleString()}</p>
      </div>

      <div className="relative max-w-sm no-print">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by ID or village..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <div className="grid grid-cols-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Screening ID</span>
            <span>Marital Status</span>
            <span>Village</span>
            <span>Gestational Age</span>
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
              <ClipboardList className="w-8 h-8 opacity-30" />
              <p>{search ? "No matching records." : "No enrolments yet."}</p>
            </div>
          ) : (
            filtered.map((e: Enrolment) => (
              <Link key={e.screeningId} href={`/screening/${e.screeningId}`}>
                <div className="grid grid-cols-5 px-4 py-3 border-b last:border-0 hover:bg-muted/40 cursor-pointer text-sm transition-colors">
                  <span className="font-medium text-primary">{e.screeningId}</span>
                  <span>{e.maritalStatus ?? <span className="text-muted-foreground/50 italic">—</span>}</span>
                  <span>{e.village ?? <span className="text-muted-foreground/50 italic">—</span>}</span>
                  <span>{e.gestationalAge ? `${e.gestationalAge} wks` : <span className="text-muted-foreground/50 italic">—</span>}</span>
                  <span className="text-muted-foreground">{e.createdBy}</span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
