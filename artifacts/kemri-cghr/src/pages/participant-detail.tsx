import { useParams } from "wouter";
import { Link } from "wouter";
import {
  useGetScreening, useGetEnrolment, useListAncVisits, useGetDelivery, useGetCloseout,
  useDeleteScreening,
  getListScreeningsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteDialog } from "@/components/delete-dialog";
import { ParticipantStatusBadge } from "@/components/status-badge";
import {
  ArrowLeft, Edit, Plus, User, ClipboardList, Activity, Baby, FileX, Printer
} from "lucide-react";
import EnrolmentTab from "./participant-tabs/enrolment-tab";
import AncTab from "./participant-tabs/anc-tab";
import DeliveryTab from "./participant-tabs/delivery-tab";
import CloseoutTab from "./participant-tabs/closeout-tab";

function FieldRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-0 text-sm">
      <span className="text-muted-foreground font-medium w-48 shrink-0">{label}</span>
      <span className="text-right">{value ?? <span className="text-muted-foreground/50 italic">—</span>}</span>
    </div>
  );
}

function YesNoBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground/50 italic text-sm">—</span>;
  return <Badge variant={value === "Yes" ? "default" : "secondary"} className={value === "Yes" ? "bg-green-600" : ""}>{value}</Badge>;
}

export default function ParticipantDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: screening, isLoading } = useGetScreening(id);
  const { data: enrolment } = useGetEnrolment(id);
  const { data: ancVisits } = useListAncVisits({ screeningId: id });
  const { data: delivery } = useGetDelivery(id);
  const { data: closeout } = useGetCloseout(id);

  const deleteMutation = useDeleteScreening();

  const isEnrolled = !!enrolment;
  const canEnrol = screening?.eligible === "Yes" && screening?.consented === "Yes";

  const handleDelete = async (reason: string) => {
    await deleteMutation.mutateAsync({ screeningId: id, data: { reason } });
    await qc.invalidateQueries({ queryKey: getListScreeningsQueryKey() });
    setLocation("/screening");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!screening) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Screening record not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/screening">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-primary">{screening.screeningId}</h1>
              <ParticipantStatusBadge eligible={screening.eligible} consented={screening.consented} />
              {isEnrolled && <Badge className="bg-blue-600">Enrolled</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">{screening.healthFacility} · {screening.interviewDate}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="no-print" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />Print
          </Button>
          {user?.role === "data_manager" && (
            <>
              <Link href={`/screening/${id}/edit`}>
                <Button variant="outline" size="sm" className="no-print"><Edit className="w-4 h-4 mr-2" />Edit</Button>
              </Link>
              <DeleteDialog
                onConfirm={handleDelete}
                trigger={<Button variant="outline" size="sm" className="no-print text-destructive border-destructive/30 hover:bg-destructive/10">Delete</Button>}
              />
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="screening">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="screening" className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Screening</TabsTrigger>
          <TabsTrigger value="enrolment" disabled={!canEnrol} className="flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" />Enrolment</TabsTrigger>
          <TabsTrigger value="anc" disabled={!isEnrolled} className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />ANC</TabsTrigger>
          <TabsTrigger value="delivery" disabled={!isEnrolled} className="flex items-center gap-1.5"><Baby className="w-3.5 h-3.5" />Delivery</TabsTrigger>
          <TabsTrigger value="closeout" className="flex items-center gap-1.5"><FileX className="w-3.5 h-3.5" />Closeout</TabsTrigger>
        </TabsList>

        {/* Screening Tab */}
        <TabsContent value="screening" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Administrative</CardTitle></CardHeader>
              <CardContent>
                <FieldRow label="Screening ID" value={screening.screeningId} />
                <FieldRow label="Interview Date" value={screening.interviewDate} />
                <FieldRow label="Health Facility" value={screening.healthFacility} />
                <FieldRow label="Recorded By" value={screening.createdBy} />
                <FieldRow label="Created At" value={new Date(screening.createdAt).toLocaleString()} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Demographics</CardTitle></CardHeader>
              <CardContent>
                <FieldRow label="Date of Birth" value={screening.dob} />
                <FieldRow label="Age" value={screening.ageYears !== null && screening.ageYears !== undefined ? `${screening.ageYears} yrs ${screening.ageMonths ?? 0} mos` : undefined} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Vital Signs</CardTitle></CardHeader>
              <CardContent>
                <FieldRow label="Height (cm)" value={screening.height} />
                <FieldRow label="Weight (kg)" value={screening.weight} />
                <FieldRow label="BMI" value={screening.bmi} />
                <FieldRow label="Temperature (°C)" value={screening.temperature} />
                <FieldRow label="Resp Rate (/min)" value={screening.respRate} />
                <FieldRow label="Pulse Rate (/min)" value={screening.pulseRate} />
                <FieldRow label="Blood Pressure" value={screening.bloodPressure} />
                <FieldRow label="LMP" value={screening.lmp} />
                <FieldRow label="Fundal Height (cm)" value={screening.fundalHeight} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Eligibility</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: "Inc 1: Residing in study area", val: screening.inclusion1 },
                    { label: "Inc 2: 14–36 weeks gestation", val: screening.inclusion2 },
                    { label: "Inc 3: Plans to deliver at facility", val: screening.inclusion3 },
                    { label: "Inc 4: Provides informed consent", val: screening.inclusion4 },
                    { label: "Inc 5: Intends to remain in area", val: screening.inclusion5 },
                    { label: "Excl 1: Prior influenza vaccine", val: screening.exclusion1 },
                    { label: "Excl 2: In another vaccine trial", val: screening.exclusion2 },
                    { label: "Excl 3: Known vaccine allergy", val: screening.exclusion3 },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b last:border-0 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <YesNoBadge value={val} />
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2 border-t mt-2">
                    <span className="font-semibold text-sm">Overall Eligible</span>
                    <YesNoBadge value={screening.eligible} />
                  </div>
                  <div className="flex justify-between items-center py-2 border-t">
                    <span className="font-semibold text-sm">Consented</span>
                    <YesNoBadge value={screening.consented} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enrolment Tab */}
        <TabsContent value="enrolment" className="mt-4">
          <EnrolmentTab screeningId={id} enrolment={enrolment} />
        </TabsContent>

        {/* ANC Tab */}
        <TabsContent value="anc" className="mt-4">
          <AncTab screeningId={id} visits={ancVisits} />
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="mt-4">
          <DeliveryTab screeningId={id} delivery={delivery} />
        </TabsContent>

        {/* Closeout Tab */}
        <TabsContent value="closeout" className="mt-4">
          <CloseoutTab screeningId={id} closeout={closeout} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
