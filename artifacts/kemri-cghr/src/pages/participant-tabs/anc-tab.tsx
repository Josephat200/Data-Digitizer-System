import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateAncVisit, useUpdateAncVisit, useDeleteAncVisit,
  getListAncVisitsQueryKey,
  type AncVisit
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteDialog } from "@/components/delete-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Save, ChevronDown, ChevronUp } from "lucide-react";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function AncForm({
  screeningId, visit, nextVisitNumber, onCancel, onSaved
}: {
  screeningId: string;
  visit?: AncVisit;
  nextVisitNumber: number;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const createMutation = useCreateAncVisit();
  const updateMutation = useUpdateAncVisit();

  const [form, setForm] = useState({
    visitNumber: visit?.visitNumber?.toString() || nextVisitNumber.toString(),
    visitDate: visit?.visitDate || "",
    gestationalAge: visit?.gestationalAge?.toString() || "",
    weight: visit?.weight?.toString() || "",
    bp: visit?.bp || "",
    fundalHeight: visit?.fundalHeight?.toString() || "",
    muac: visit?.muac?.toString() || "",
    complaints: visit?.complaints || "",
    medication: visit?.medication || "",
    nextAppointment: visit?.nextAppointment || "",
    reason: "",
  });

  const setInput = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = {
      visitDate: form.visitDate,
      gestationalAge: form.gestationalAge ? parseInt(form.gestationalAge) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      bp: form.bp || undefined,
      fundalHeight: form.fundalHeight ? parseFloat(form.fundalHeight) : undefined,
      muac: form.muac ? parseFloat(form.muac) : undefined,
      complaints: form.complaints || undefined,
      medication: form.medication || undefined,
      nextAppointment: form.nextAppointment || undefined,
    };
    try {
      if (visit) {
        await updateMutation.mutateAsync({ id: visit.id, data: { ...payload, reason: form.reason || undefined } });
      } else {
        await createMutation.mutateAsync({ data: { screeningId, visitNumber: parseInt(form.visitNumber), ...payload } });
      }
      await qc.invalidateQueries({ queryKey: getListAncVisitsQueryKey({ screeningId }) });
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Failed to save ANC visit");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{visit ? `Edit Visit ${visit.visitNumber}` : `New ANC Visit (Visit #${form.visitNumber})`}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormField label="Visit Date *">
              <Input type="date" value={form.visitDate} onChange={setInput("visitDate")} required />
            </FormField>
            <FormField label="Gestational Age (wks)">
              <Input type="number" value={form.gestationalAge} onChange={setInput("gestationalAge")} />
            </FormField>
            <FormField label="Weight (kg)">
              <Input type="number" step="0.1" value={form.weight} onChange={setInput("weight")} />
            </FormField>
            <FormField label="Blood Pressure">
              <Input value={form.bp} onChange={setInput("bp")} placeholder="e.g. 120/80" />
            </FormField>
            <FormField label="Fundal Height (cm)">
              <Input type="number" step="0.1" value={form.fundalHeight} onChange={setInput("fundalHeight")} />
            </FormField>
            <FormField label="MUAC (cm)">
              <Input type="number" step="0.1" value={form.muac} onChange={setInput("muac")} />
            </FormField>
          </div>
          <FormField label="Complaints">
            <Textarea value={form.complaints} onChange={setInput("complaints")} rows={2} placeholder="Any complaints or symptoms..." />
          </FormField>
          <FormField label="Medication / Treatment">
            <Textarea value={form.medication} onChange={setInput("medication")} rows={2} placeholder="Medications prescribed..." />
          </FormField>
          <FormField label="Next Appointment">
            <Input type="date" value={form.nextAppointment} onChange={setInput("nextAppointment")} />
          </FormField>
          {visit && (
            <FormField label="Reason for Edit *">
              <Textarea value={form.reason} onChange={setInput("reason")} rows={2} placeholder="Required for audit trail..." />
            </FormField>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Visit"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AncTab({ screeningId, visits }: { screeningId: string; visits?: AncVisit[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const deleteMutation = useDeleteAncVisit();

  const nextVisitNumber = (visits?.length ?? 0) + 1;

  const handleDelete = async (visitId: number, reason: string) => {
    await deleteMutation.mutateAsync({ id: visitId, data: { reason } });
    await qc.invalidateQueries({ queryKey: getListAncVisitsQueryKey({ screeningId }) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{visits?.length ?? 0} ANC visit{visits?.length !== 1 ? "s" : ""} recorded</p>
        {user?.role === "data_manager" && !showForm && !editingId && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />New ANC Visit
          </Button>
        )}
      </div>

      {showForm && (
        <AncForm
          screeningId={screeningId}
          nextVisitNumber={nextVisitNumber}
          onCancel={() => setShowForm(false)}
          onSaved={() => setShowForm(false)}
        />
      )}

      {visits?.map(visit => (
        editingId === visit.id ? (
          <AncForm
            key={visit.id}
            screeningId={screeningId}
            visit={visit}
            nextVisitNumber={nextVisitNumber}
            onCancel={() => setEditingId(null)}
            onSaved={() => setEditingId(null)}
          />
        ) : (
          <Card key={visit.id}>
            <CardHeader className="py-3 cursor-pointer" onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="text-xs">Visit {visit.visitNumber}</Badge>
                  <span className="text-sm font-medium">{visit.visitDate}</span>
                  {visit.gestationalAge && (
                    <span className="text-xs text-muted-foreground">{visit.gestationalAge} weeks GA</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {user?.role === "data_manager" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setEditingId(visit.id); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <div onClick={e => e.stopPropagation()}>
                        <DeleteDialog onConfirm={(r) => handleDelete(visit.id, r)} trigger={
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">Delete</Button>
                        } />
                      </div>
                    </>
                  )}
                  {expandedId === visit.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            </CardHeader>
            {expandedId === visit.id && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  {[
                    ["Weight (kg)", visit.weight],
                    ["Blood Pressure", visit.bp],
                    ["Fundal Height", visit.fundalHeight ? `${visit.fundalHeight} cm` : null],
                    ["MUAC", visit.muac ? `${visit.muac} cm` : null],
                    ["Complaints", visit.complaints],
                    ["Medication", visit.medication],
                    ["Next Appointment", visit.nextAppointment],
                    ["Recorded By", visit.createdBy],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <span className="text-muted-foreground block text-xs">{label as string}</span>
                      <span className="font-medium">{val ?? <span className="italic opacity-40">—</span>}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )
      ))}

      {!visits?.length && !showForm && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No ANC visits recorded yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
