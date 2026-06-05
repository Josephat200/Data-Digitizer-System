import { useListScreenings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Download, Printer } from "lucide-react";
import { useState } from "react";
import { ParticipantStatusBadge } from "@/components/status-badge";
import { downloadCsv, todayStamp } from "@/lib/export";

export default function ScreeningList() {
  const { user } = useAuth();
  const [facility, setFacility] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const { data: screenings, isLoading } = useListScreenings({
    facility: facility === "all" ? undefined : facility,
    search: search || undefined
  });

  const handleExport = () => {
    downloadCsv(`KEMRI_CGHR_Screenings_${todayStamp()}.csv`, (screenings ?? []) as Record<string, unknown>[], [
      { key: "screeningId", label: "Screening ID" },
      { key: "interviewDate", label: "Interview Date" },
      { key: "healthFacility", label: "Health Facility" },
      { key: "dob", label: "Date of Birth" },
      { key: "ageYears", label: "Age (Years)" },
      { key: "ageMonths", label: "Age (Months)" },
      { key: "height", label: "Height (cm)" },
      { key: "weight", label: "Weight (kg)" },
      { key: "bmi", label: "BMI" },
      { key: "eligible", label: "Eligible" },
      { key: "consented", label: "Consented" },
      { key: "createdBy", label: "Recorded By" },
      { key: "createdAt", label: "Created At" },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Screening Records</h1>
          <p className="text-muted-foreground">Manage participant screening and eligibility</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!screenings?.length}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          {user?.role === "data_manager" && (
            <Link href="/screening/new">
              <Button className="font-semibold shadow-sm">
                <Plus className="w-4 h-4 mr-2" />New Screening
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Print header (hidden on screen) */}
      <div className="print-header hidden">
        <p className="text-xs text-gray-500">KEMRI-CGHR Influenza Program CDMS &nbsp;·&nbsp; Screening Records &nbsp;·&nbsp; Printed: {new Date().toLocaleString()}</p>
      </div>

      <Card className="shadow-sm border-primary/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filter &amp; Search</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-2 no-print">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={facility} onValueChange={setFacility}>
                <SelectTrigger><SelectValue placeholder="All Facilities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  <SelectItem value="Bondo">Bondo</SelectItem>
                  <SelectItem value="Siaya">Siaya</SelectItem>
                  <SelectItem value="Kuoyo">Kuoyo</SelectItem>
                  <SelectItem value="Lumumba">Lumumba</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Screening ID</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Facility</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {screenings?.map((screening) => (
                    <tr key={screening.screeningId} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-medium text-primary">
                        <Link href={`/screening/${screening.screeningId}`} className="hover:underline">
                          {screening.screeningId}
                        </Link>
                      </td>
                      <td className="p-4 align-middle">{screening.interviewDate}</td>
                      <td className="p-4 align-middle">{screening.healthFacility}</td>
                      <td className="p-4 align-middle">
                        <ParticipantStatusBadge eligible={screening.eligible} consented={screening.consented} />
                      </td>
                      <td className="p-4 align-middle text-right no-print">
                        <Link href={`/screening/${screening.screeningId}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!screenings?.length && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">No screening records found</td>
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
