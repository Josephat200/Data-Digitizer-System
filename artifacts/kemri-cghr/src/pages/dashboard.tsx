import { 
  useGetDashboardSummary, 
  useGetSiteSummary, 
  useGetReminders 
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, Activity, Baby, FileX, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: siteSummary, isLoading: loadingSites } = useGetSiteSummary();
  const { data: reminders, isLoading: loadingReminders } = useGetReminders();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
          <p className="text-muted-foreground">Overview of the influenza research program</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Screened" value={summary?.screened} icon={Users} loading={loadingSummary} link="/screening" />
        <StatCard title="Enrolled" value={summary?.enrolled} icon={ClipboardList} loading={loadingSummary} link="/enrolment" />
        <StatCard title="ANC Visits" value={summary?.ancVisits} icon={Activity} loading={loadingSummary} link="/anc" />
        <StatCard title="Deliveries" value={summary?.deliveries} icon={Baby} loading={loadingSummary} link="/delivery" />
        <StatCard title="Closeouts" value={summary?.closeouts} icon={FileX} loading={loadingSummary} link="/closeout" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Site Summary Table */}
        <Card className="lg:col-span-4 shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle>Site Performance</CardTitle>
            <CardDescription>Enrollment and delivery metrics by health facility</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSites ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Facility</th>
                      <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Screened</th>
                      <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Enrolled</th>
                      <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Deliveries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siteSummary?.map((site) => (
                      <tr key={site.facility} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-medium">{site.facility}</td>
                        <td className="p-4 align-middle text-right">{site.screened}</td>
                        <td className="p-4 align-middle text-right">{site.enrolled}</td>
                        <td className="p-4 align-middle text-right">{site.deliveries}</td>
                      </tr>
                    ))}
                    {!siteSummary?.length && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminders List */}
        <Card className="lg:col-span-3 shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Action Required
            </CardTitle>
            <CardDescription>Upcoming visits and past-due items</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReminders ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {reminders?.map((reminder, idx) => (
                  <div key={idx} className="flex flex-col gap-1 pb-3 border-b last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <Link href={`/screening/${reminder.screeningId}`} className="font-semibold text-sm hover:underline text-primary">
                        {reminder.screeningId}
                      </Link>
                      <Badge variant={reminder.type === "ANC" ? "secondary" : "default"}>{reminder.type}</Badge>
                    </div>
                    <div className="text-sm">{reminder.message}</div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Due: {reminder.dueDate}</span>
                      <span>{reminder.healthFacility}</span>
                    </div>
                  </div>
                ))}
                {!reminders?.length && (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    No upcoming reminders
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  title, value, icon: Icon, loading, link 
}: { 
  title: string; value?: number; icon: any; loading: boolean; link: string 
}) {
  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value || 0}</div>
        )}
        <div className="mt-2">
          <Link href={link}>
            <Button variant="link" className="p-0 h-auto text-xs text-primary">
              View all
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
