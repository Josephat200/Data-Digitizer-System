import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateEnrolment, useUpdateEnrolment, useDeleteEnrolment,
  getGetEnrolmentQueryKey,
  type Enrolment
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { calculateBmi, isBmiAbnormal } from "@/lib/clinical";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteDialog } from "@/components/delete-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Save, AlertTriangle } from "lucide-react";

function FieldRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-0 text-sm">
      <span className="text-muted-foreground font-medium w-44 shrink-0">{label}</span>
      <span className="text-right">{value ?? <span className="italic opacity-40">—</span>}</span>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

const MARITAL_OPTIONS = ["Single", "Married", "Widowed", "Divorced"];
const EDUCATION_OPTIONS = ["None", "Primary", "Secondary", "Tertiary"];

export default function EnrolmentTab({ screeningId, enrolment }: { screeningId: string; enrolment?: Enrolment }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    maritalStatus: "", husbandName: "", village: "", education: "", occupation: "",
    height: "", weight: "", temperature: "", respRate: "", pulseRate: "",
    bloodPressure: "", gestationalAge: "", reason: "",
  });

  useEffect(() => {
    if (enrolment) {
      setForm({
        maritalStatus: enrolment.maritalStatus || "",
        husbandName: enrolment.husbandName || "",
        village: enrolment.village || "",
        education: enrolment.education || "",
        occupation: enrolment.occupation || "",
        height: enrolment.height?.toString() || "",
        weight: enrolment.weight?.toString() || "",
        temperature: enrolment.temperature?.toString() || "",
        respRate: enrolment.respRate?.toString() || "",
        pulseRate: enrolment.pulseRate?.toString() || "",
        bloodPressure: enrolment.bloodPressure || "",
        gestationalAge: enrolment.gestationalAge?.toString() || "",
        reason: "",
      });
    }
  }, [enrolment]);

  const createMutation = useCreateEnrolment();
  const updateMutation = useUpdateEnrolment();
  const deleteMutation = useDeleteEnrolment();

  const bmi = calculateBmi(
    form.weight ? parseFloat(form.weight) : null,
    form.height ? parseFloat(form.height) : null
  );

  const set = (key: keyof typeof form) => (value: string) => setForm(f => ({ ...f, [key]: value }));
  const setInput = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = {
      maritalStatus: form.maritalStatus || undefined,
      husbandName: form.husbandName || undefined,
      village: form.village || undefined,
      education: form.education || undefined,
      occupation: form.occupation || undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      temperature: form.temperature ? parseFloat(form.temperature) : undefined,
      respRate: form.respRate ? parseInt(form.respRate) : undefined,
      pulseRate: form.pulseRate ? parseInt(form.pulseRate) : undefined,
      bloodPressure: form.bloodPressure || undefined,
      gestationalAge: form.gestationalAge ? parseInt(form.gestationalAge) : undefined,
    };
    try {
      if (enrolment) {
        await updateMutation.mutateAsync({ screeningId, data: { ...payload, reason: form.reason || undefined } });
      } else {
        await createMutation.mutateAsync({ data: { screeningId, ...payload } });
      }
      await qc.invalidateQueries({ queryKey: getGetEnrolmentQueryKey(screeningId) });
      setEditing(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save enrolment");
    }
  };

  const handleDelete = async (reason: string) => {
    await deleteMutation.mutateAsync({ screeningId, data: { reason } });
    await qc.invalidateQueries({ queryKey: getGetEnrolmentQueryKey(screeningId) });
  };

  if (!enrolment && !editing) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <p className="text-muted-foreground">No enrolment record yet.</p>
          {user?.role === "data_manager" && (
            <Button onClick={() => setEditing(true)}><Plus className="w-4 h-4 mr-2" />Enrol Participant</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{enrolment ? "Edit Enrolment" : "New Enrolment"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Marital Status">
                <Select value={form.maritalStatus} onValueChange={set("maritalStatus")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{MARITAL_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Husband's Name">
                <Input value={form.husbandName} onChange={setInput("husbandName")} placeholder="Full name" />
              </FormField>
              <FormField label="Village">
                <Input value={form.village} onChange={setInput("village")} placeholder="Village name" />
              </FormField>
              <FormField label="Education Level">
                <Select value={form.education} onValueChange={set("education")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{EDUCATION_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Occupation">
                <Input value={form.occupation} onChange={setInput("occupation")} placeholder="e.g. Farmer" />
              </FormField>
              <FormField label="Gestational Age (weeks)">
                <Input type="number" value={form.gestationalAge} onChange={setInput("gestationalAge")} placeholder="e.g. 20" />
              </FormField>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">Vital Signs at Enrolment</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField label="Height (cm)">
                <Input type="number" step="0.1" value={form.height} onChange={setInput("height")} />
              </FormField>
              <FormField label="Weight (kg)">
                <Input type="number" step="0.1" value={form.weight} onChange={setInput("weight")} />
              </FormField>
              <FormField label="Temperature (°C)">
                <Input type="number" step="0.1" value={form.temperature} onChange={setInput("temperature")} />
              </FormField>
              <FormField label="Resp Rate (/min)">
                <Input type="number" value={form.respRate} onChange={setInput("respRate")} />
              </FormField>
              <FormField label="Pulse Rate (/min)">
                <Input type="number" value={form.pulseRate} onChange={setInput("pulseRate")} />
              </FormField>
              <FormField label="Blood Pressure">
                <Input value={form.bloodPressure} onChange={setInput("bloodPressure")} placeholder="e.g. 120/80" />
              </FormField>
            </div>
            {bmi !== null && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border">
                <span className="text-sm font-medium">BMI:</span>
                <Badge variant={isBmiAbnormal(bmi) ? "destructive" : "secondary"}>{bmi}</Badge>
                {isBmiAbnormal(bmi) && <span className="flex items-center gap-1 text-sm text-destructive"><AlertTriangle className="w-4 h-4" /> Outside normal range</span>}
              </div>
            )}
            {enrolment && (
              <FormField label="Reason for Edit *">
                <Textarea value={form.reason} onChange={setInput("reason")} rows={2} placeholder="Required for audit trail..." />
              </FormField>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {user?.role === "data_manager" && (
          <>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
            <DeleteDialog onConfirm={handleDelete} trigger={
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">Delete</Button>
            } />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent>
            <FieldRow label="Marital Status" value={enrolment?.maritalStatus} />
            <FieldRow label="Husband's Name" value={enrolment?.husbandName} />
            <FieldRow label="Village" value={enrolment?.village} />
            <FieldRow label="Education" value={enrolment?.education} />
            <FieldRow label="Occupation" value={enrolment?.occupation} />
            <FieldRow label="Gestational Age" value={enrolment?.gestationalAge ? `${enrolment.gestationalAge} weeks` : null} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Vital Signs at Enrolment</CardTitle></CardHeader>
          <CardContent>
            <FieldRow label="Height (cm)" value={enrolment?.height} />
            <FieldRow label="Weight (kg)" value={enrolment?.weight} />
            <FieldRow label="BMI" value={enrolment?.bmi} />
            <FieldRow label="Temperature (°C)" value={enrolment?.temperature} />
            <FieldRow label="Resp Rate (/min)" value={enrolment?.respRate} />
            <FieldRow label="Pulse Rate (/min)" value={enrolment?.pulseRate} />
            <FieldRow label="Blood Pressure" value={enrolment?.bloodPressure} />
            <FieldRow label="Recorded By" value={enrolment?.createdBy} />
            <FieldRow label="Created" value={enrolment ? new Date(enrolment.createdAt).toLocaleString() : null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
