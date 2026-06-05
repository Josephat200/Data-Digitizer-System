import { useState } from "react";
import { Link } from "wouter";
import { useListAncVisits, type AncVisit } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Activity } from "lucide-react";

export default function AncList() {
  const [search, setSearch] = useState("");
  const { data: visits, isLoading } = useListAncVisits({});

  const filtered = (visits ?? []).filter((v: AncVisit) =>
    !search || v.screeningId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">ANC Visits</h1>
          <p className="text-muted-foreground text-sm">All antenatal care visits</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">{visits?.length ?? 0} total</Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by Screening ID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <div className="grid grid-cols-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Screening ID</span>
            <span>Visit #</span>
            <span>Visit Date</span>
            <span>Gest. Age</span>
            <span>Weight (kg)</span>
            <span>Next Appointment</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b"><Skeleton className="h-4 w-full" /></div>
            ))
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Activity className="w-8 h-8 opacity-30" />
              <p>{search ? "No matching records." : "No ANC visits yet."}</p>
            </div>
          ) : (
            filtered.map((v: AncVisit) => (
              <Link key={v.id} href={`/screening/${v.screeningId}`}>
                <div className="grid grid-cols-6 px-4 py-3 border-b last:border-0 hover:bg-muted/40 cursor-pointer text-sm transition-colors">
                  <span className="font-medium text-primary">{v.screeningId}</span>
                  <span><Badge variant="outline" className="text-xs">Visit {v.visitNumber}</Badge></span>
                  <span>{v.visitDate}</span>
                  <span>{v.gestationalAge ? `${v.gestationalAge} wks` : <span className="text-muted-foreground/50 italic">—</span>}</span>
                  <span>{v.weight ?? <span className="text-muted-foreground/50 italic">—</span>}</span>
                  <span>{v.nextAppointment ?? <span className="text-muted-foreground/50 italic">—</span>}</span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
