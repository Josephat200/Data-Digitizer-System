import { useState } from "react";
import { Link } from "wouter";
import { useListEnrolments, type Enrolment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ClipboardList } from "lucide-react";

export default function EnrolmentList() {
  const [search, setSearch] = useState("");
  const { data: enrolments, isLoading } = useListEnrolments({});

  const filtered = (enrolments ?? []).filter((e: Enrolment) =>
    !search || e.screeningId.toLowerCase().includes(search.toLowerCase()) ||
    (e.village ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Enrolments</h1>
          <p className="text-muted-foreground text-sm">All enrolled participants</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">{enrolments?.length ?? 0} total</Badge>
      </div>

      <div className="relative max-w-sm">
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
