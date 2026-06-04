import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateScreening, useGetScreening, useUpdateScreening,
  getListScreeningsQueryKey, getGetScreeningQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { calculateBmi, isBmiAbnormal } from "@/lib/clinical";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { Textarea } from "@/components/ui/textarea";

const FACILITIES = ["Bondo", "Siaya", "Kuoyo", "Lumumba"];

const YES_NO_OPTIONS = ["Yes", "No"];

function YesNoSelect({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {YES_NO_OPTIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function ScreeningForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = id && id !== "new";
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: existing } = useGetScreening(isEdit ? id! : "");

  const createMutation = useCreateScreening();
  const updateMutation = useUpdateScreening();

  const [form, setForm] = useState({
    interviewDate: "", healthFacility: "", dob: "", ageYears: "", ageMonths: "",
    height: "", weight: "", temperature: "", respRate: "", pulseRate: "", bloodPressure: "",
    lmp: "", fundalHeight: "",
    inclusion1: "", inclusion2: "", inclusion3: "", inclusion4: "", inclusion5: "",
    exclusion1: "", exclusion2: "", exclusion3: "",
    eligible: "", consented: "",
    reason: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (existing) {
      setForm({
        interviewDate: existing.interviewDate || "",
        healthFacility: existing.healthFacility || "",
        dob: existing.dob || "",
        ageYears: existing.ageYears?.toString() || "",
        ageMonths: existing.ageMonths?.toString() || "",
        height: existing.height?.toString() || "",
        weight: existing.weight?.toString() || "",
        temperature: existing.temperature?.toString() || "",
        respRate: existing.respRate?.toString() || "",
        pulseRate: existing.pulseRate?.toString() || "",
        bloodPressure: existing.bloodPressure || "",
        lmp: existing.lmp || "",
        fundalHeight: existing.fundalHeight?.toString() || "",
        inclusion1: existing.inclusion1 || "",
        inclusion2: existing.inclusion2 || "",
        inclusion3: existing.inclusion3 || "",
        inclusion4: existing.inclusion4 || "",
        inclusion5: existing.inclusion5 || "",
        exclusion1: existing.exclusion1 || "",
        exclusion2: existing.exclusion2 || "",
        exclusion3: existing.exclusion3 || "",
        eligible: existing.eligible || "",
        consented: existing.consented || "",
        reason: "",
      });
    }
  }, [existing]);

  const bmi = calculateBmi(
    form.weight ? parseFloat(form.weight) : null,
    form.height ? parseFloat(form.height) : null
  );
  const bmiWarning = isBmiAbnormal(bmi);

  const set = (key: keyof typeof form) => (value: string) => setForm(f => ({ ...f, [key]: value }));
  const setInput = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = {
      interviewDate: form.interviewDate,
      healthFacility: form.healthFacility,
      dob: form.dob || undefined,
      ageYears: form.ageYears ? parseInt(form.ageYears) : undefined,
      ageMonths: form.ageMonths ? parseInt(form.ageMonths) : undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      temperature: form.temperature ? parseFloat(form.temperature) : undefined,
      respRate: form.respRate ? parseInt(form.respRate) : undefined,
      pulseRate: form.pulseRate ? parseInt(form.pulseRate) : undefined,
      bloodPressure: form.bloodPressure || undefined,
      lmp: form.lmp || undefined,
      fundalHeight: form.fundalHeight ? parseFloat(form.fundalHeight) : undefined,
      inclusion1: form.inclusion1 || undefined,
      inclusion2: form.inclusion2 || undefined,
      inclusion3: form.inclusion3 || undefined,
      inclusion4: form.inclusion4 || undefined,
      inclusion5: form.inclusion5 || undefined,
      exclusion1: form.exclusion1 || undefined,
      exclusion2: form.exclusion2 || undefined,
      exclusion3: form.exclusion3 || undefined,
      eligible: form.eligible || undefined,
      consented: form.consented || undefined,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ screeningId: id!, data: { ...payload, reason: form.reason || undefined } });
        await qc.invalidateQueries({ queryKey: getGetScreeningQueryKey(id!) });
        setLocation(`/screening/${id}`);
      } else {
        const result = await createMutation.mutateAsync({ data: payload });
        await qc.invalidateQueries({ queryKey: getListScreeningsQueryKey() });
        setLocation(`/screening/${result.screeningId}`);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save screening record");
    }
  };

  if (user?.role !== "data_manager") {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>Only Data Managers can create or edit screening records.</AlertDescription>
        </Alert>
        <Link href="/screening"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={isEdit ? `/screening/${id}` : "/screening"}>
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            {isEdit ? `Edit Screening — ${id}` : "New Screening"}
          </h1>
          <p className="text-muted-foreground text-sm">Fill in all required fields</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Administrative */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Administrative Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Interview Date *">
              <Input type="date" value={form.interviewDate} onChange={setInput("interviewDate")} required />
            </FormField>
            <FormField label="Health Facility *">
              <Select value={form.healthFacility} onValueChange={set("healthFacility")}>
                <SelectTrigger><SelectValue placeholder="Select facility..." /></SelectTrigger>
                <SelectContent>{FACILITIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
          </CardContent>
        </Card>

        {/* Demographics */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Demographics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Date of Birth">
              <Input type="date" value={form.dob} onChange={setInput("dob")} />
            </FormField>
            <FormField label="Age (Years)">
              <Input type="number" min="0" value={form.ageYears} onChange={setInput("ageYears")} placeholder="e.g. 28" />
            </FormField>
            <FormField label="Age (Months)">
              <Input type="number" min="0" max="11" value={form.ageMonths} onChange={setInput("ageMonths")} placeholder="e.g. 6" />
            </FormField>
          </CardContent>
        </Card>

        {/* Vital Signs */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Vital Signs & Anthropometry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField label="Height (cm)">
                <Input type="number" step="0.1" value={form.height} onChange={setInput("height")} placeholder="e.g. 162" />
              </FormField>
              <FormField label="Weight (kg)">
                <Input type="number" step="0.1" value={form.weight} onChange={setInput("weight")} placeholder="e.g. 62" />
              </FormField>
              <FormField label="Temperature (°C)">
                <Input type="number" step="0.1" value={form.temperature} onChange={setInput("temperature")} placeholder="e.g. 36.8" />
              </FormField>
              <FormField label="Resp. Rate (/min)">
                <Input type="number" value={form.respRate} onChange={setInput("respRate")} placeholder="e.g. 18" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField label="Pulse Rate (/min)">
                <Input type="number" value={form.pulseRate} onChange={setInput("pulseRate")} placeholder="e.g. 76" />
              </FormField>
              <FormField label="Blood Pressure">
                <Input value={form.bloodPressure} onChange={setInput("bloodPressure")} placeholder="e.g. 120/80" />
              </FormField>
              <FormField label="LMP Date">
                <Input type="date" value={form.lmp} onChange={setInput("lmp")} />
              </FormField>
              <FormField label="Fundal Height (cm)">
                <Input type="number" step="0.1" value={form.fundalHeight} onChange={setInput("fundalHeight")} placeholder="e.g. 22" />
              </FormField>
            </div>
            {bmi !== null && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border">
                <span className="text-sm font-medium">Calculated BMI:</span>
                <Badge variant={bmiWarning ? "destructive" : "secondary"} className="text-base px-3 py-1">
                  {bmi}
                </Badge>
                {bmiWarning && (
                  <span className="flex items-center gap-1 text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4" /> Outside normal range (15–45)
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eligibility Criteria */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Eligibility Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Inclusion Criteria</p>
              <div className="space-y-3">
                {[
                  { key: "inclusion1" as const, label: "1. Pregnant woman residing in the study area" },
                  { key: "inclusion2" as const, label: "2. Between 14 and 36 weeks gestation" },
                  { key: "inclusion3" as const, label: "3. Plans to deliver at a study facility" },
                  { key: "inclusion4" as const, label: "4. Provides written informed consent" },
                  { key: "inclusion5" as const, label: "5. Intends to remain in study area until delivery" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <Label className="text-sm flex-1">{label}</Label>
                    <div className="w-28"><YesNoSelect id={key} value={form[key]} onChange={set(key)} /></div>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Exclusion Criteria</p>
              <div className="space-y-3">
                {[
                  { key: "exclusion1" as const, label: "1. Has received influenza vaccine in past 6 months" },
                  { key: "exclusion2" as const, label: "2. Currently enrolled in another vaccine trial" },
                  { key: "exclusion3" as const, label: "3. Known allergy to vaccine components" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <Label className="text-sm flex-1">{label}</Label>
                    <div className="w-28"><YesNoSelect id={key} value={form[key]} onChange={set(key)} /></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eligibility Outcome */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Eligibility Outcome</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Eligible">
              <YesNoSelect id="eligible" value={form.eligible} onChange={set("eligible")} />
            </FormField>
            <FormField label="Consented">
              <YesNoSelect id="consented" value={form.consented} onChange={set("consented")} />
            </FormField>
          </CardContent>
        </Card>

        {isEdit && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Reason for Edit</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe the reason for this edit (required for audit trail)..."
                value={form.reason}
                onChange={setInput("reason")}
                rows={3}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : isEdit ? "Save Changes" : "Create Screening"}
          </Button>
          <Link href={isEdit ? `/screening/${id}` : "/screening"}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
