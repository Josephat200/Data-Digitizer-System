import { useQuery } from "@tanstack/react-query";
import { 
  useGetDashboardSummary, 
  useGetSiteSummary, 
  useGetReminders 
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, Activity, Baby, FileX, AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type MonthlyPoint = { month: string; screened: number; enrolled: number };

function useMonthlyTrend() {
  return useQuery<MonthlyPoint[]>({
    queryKey: ["monthly-trend"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/reports/monthly-trend", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch trend");
      return res.json();
    },
  });
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: siteSummary, isLoading: loadingSites } = useGetSiteSummary();
  const { data: reminders, isLoading: loadingReminders } = useGetReminders();
  const { data: trend, isLoading: loadingTrend } = useMonthlyTrend();

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

      {/* Participant Pipeline */}
      <ParticipantPipeline summary={summary} loading={loadingSummary} />

      {/* Monthly Trend Chart */}
      <MonthlyTrendChart data={trend} loading={loadingTrend} />

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

function MonthlyTrendChart({ data, loading }: { data?: MonthlyPoint[]; loading: boolean }) {
  const hasData = data?.some((d) => d.screened > 0 || d.enrolled > 0);

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader>
        <CardTitle>Monthly Trend</CardTitle>
        <CardDescription>New screenings and enrolments over the past 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-56 flex items-center justify-center">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : !hasData ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            No data yet — start by screening participants.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScreened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="screened" name="Screened" stroke="#3b82f6" strokeWidth={2} fill="url(#colorScreened)" dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="enrolled" name="Enrolled" stroke="#6366f1" strokeWidth={2} fill="url(#colorEnrolled)" dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

type DashboardSummary = { screened?: number; enrolled?: number; ancVisits?: number; deliveries?: number; closeouts?: number };

function ParticipantPipeline({ summary, loading }: { summary?: DashboardSummary; loading: boolean }) {
  const screened = summary?.screened ?? 0;

  const stages = [
    { label: "Screened",  value: summary?.screened,  icon: Users,         href: "/screening", color: "bg-blue-500",   pct: 100 },
    { label: "Enrolled",  value: summary?.enrolled,  icon: ClipboardList, href: "/enrolment", color: "bg-indigo-500", pct: screened ? Math.round(((summary?.enrolled ?? 0) / screened) * 100) : 0 },
    { label: "ANC Visits",value: summary?.ancVisits, icon: Activity,      href: "/anc",        color: "bg-violet-500", pct: screened ? Math.round(((summary?.ancVisits ?? 0) / screened) * 100) : 0 },
    { label: "Deliveries",value: summary?.deliveries,icon: Baby,          href: "/delivery",   color: "bg-purple-500", pct: screened ? Math.round(((summary?.deliveries ?? 0) / screened) * 100) : 0 },
    { label: "Closeouts", value: summary?.closeouts, icon: FileX,         href: "/closeout",   color: "bg-rose-500",   pct: screened ? Math.round(((summary?.closeouts ?? 0) / screened) * 100) : 0 },
  ];

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader>
        <CardTitle>Participant Pipeline</CardTitle>
        <CardDescription>Study progress from screening through to closeout</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex gap-3 items-center">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 space-y-2">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-3 w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-stretch gap-1 sm:gap-2">
            {stages.map((stage, i) => {
              const Icon = stage.icon;
              const barPct = Math.max(stage.pct, screened > 0 ? 4 : 0);
              return (
                <div key={stage.label} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                  <Link href={stage.href} className="flex-1 min-w-0 group">
                    <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:shadow-sm transition-all bg-card group-hover:bg-muted/30 h-full">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${stage.color} text-white shadow-sm`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold tabular-nums">{stage.value ?? 0}</div>
                        <div className="text-xs text-muted-foreground font-medium leading-tight">{stage.label}</div>
                      </div>
                      {/* Funnel bar */}
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stage.color} transition-all duration-700`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground">
                        {i === 0 ? "baseline" : `${stage.pct}%`}
                      </div>
                    </div>
                  </Link>
                  {i < stages.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!loading && screened === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-3">No data yet — start by screening participants.</p>
        )}
      </CardContent>
    </Card>
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
