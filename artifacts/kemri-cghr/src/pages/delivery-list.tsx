import { useState } from "react";
import { Link } from "wouter";
import { useListDeliveries, type Delivery } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Baby, Download, Printer } from "lucide-react";
import { downloadCsv, todayStamp } from "@/lib/export";

export default function DeliveryList() {
  const [search, setSearch] = useState("");
  const { data: deliveries, isLoading } = useListDeliveries({});

  const filtered = (deliveries ?? []).filter((d: Delivery) =>
    !search || d.screeningId.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    downloadCsv(`KEMRI_CGHR_Deliveries_${todayStamp()}.csv`, filtered as Record<string, unknown>[], [
      { key: "screeningId", label: "Screening ID" },
      { key: "deliveryDate", label: "Delivery Date" },
      { key: "deliveryTime", label: "Delivery Time" },
      { key: "deliveryPlace", label: "Delivery Place" },
      { key: "deliveredBy", label: "Delivered By" },
      { key: "deliveryMode", label: "Delivery Mode" },
      { key: "csectionIndication", label: "C-Section Indication" },
      { key: "motherWeight", label: "Mother Weight (kg)" },
      { key: "temperature", label: "Temperature (°C)" },
      { key: "bloodPressure", label: "Blood Pressure" },
      { key: "oxygenSaturation", label: "O2 Saturation (%)" },
      { key: "physicalAbnormality", label: "Physical Abnormality" },
      { key: "abnormalityDetails", label: "Abnormality Details" },
      { key: "createdBy", label: "Recorded By" },
      { key: "createdAt", label: "Created At" },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Deliveries</h1>
          <p className="text-muted-foreground text-sm">All delivery records</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">{deliveries?.length ?? 0} total</Badge>
          <Button variant="outline" size="sm" className="no-print" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          <Button variant="outline" size="sm" className="no-print" onClick={handleExport} disabled={!filtered.length}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="print-header hidden">
        <p className="text-xs text-gray-500">KEMRI-CGHR Influenza Program CDMS &nbsp;·&nbsp; Deliveries &nbsp;·&nbsp; Printed: {new Date().toLocaleString()}</p>
      </div>

      <div className="relative max-w-sm no-print">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by Screening ID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <div className="grid grid-cols-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Screening ID</span>
            <span>Delivery Date</span>
            <span>Place</span>
            <span>Mode</span>
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
              <Baby className="w-8 h-8 opacity-30" />
              <p>{search ? "No matching records." : "No delivery records yet."}</p>
            </div>
          ) : (
            filtered.map((d: Delivery) => (
              <Link key={d.screeningId} href={`/screening/${d.screeningId}`}>
                <div className="grid grid-cols-5 px-4 py-3 border-b last:border-0 hover:bg-muted/40 cursor-pointer text-sm transition-colors">
                  <span className="font-medium text-primary">{d.screeningId}</span>
                  <span>{d.deliveryDate ?? <span className="text-muted-foreground/50 italic">—</span>}</span>
                  <span>{d.deliveryPlace ?? <span className="text-muted-foreground/50 italic">—</span>}</span>
                  <span>{d.deliveryMode ?? <span className="text-muted-foreground/50 italic">—</span>}</span>
                  <span className="text-muted-foreground">{d.createdBy}</span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
