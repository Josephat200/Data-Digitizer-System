import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCloseout, useUpdateCloseout, useDeleteCloseout,
  getGetCloseoutQueryKey,
  type Closeout
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteDialog } from "@/components/delete-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

const STATUSES = [
  "Completed - Delivered",
  "Withdrawn by Participant",
  "Lost to Follow-Up",
  "Pregnancy Loss",
  "Transferred Out",
  "Protocol Violation",
  "Deceased",
  "Other",
];

export default function CloseoutTab({ screeningId, closeout }: { screeningId: string; closeout?: Closeout }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    terminationDate: "", participantStatus: "", discontinuationReason: "", reason: "",
  });

  useEffect(() => {
    if (closeout) {
      setForm({
        terminationDate: closeout.terminationDate || "",
        participantStatus: closeout.participantStatus || "",
        discontinuationReason: closeout.discontinuationReason || "",
        reason: "",
      });
    }
  }, [closeout]);

  const createMutation = useCreateCloseout();
  const updateMutation = useUpdateCloseout();
  const deleteMutation = useDeleteCloseout();

  const set = (key: keyof typeof form) => (value: string) => setForm(f => ({ ...f, [key]: value }));
  const setInput = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (closeout) {
        await updateMutation.mutateAsync({
          screeningId,
          data: {
            terminationDate: form.terminationDate || undefined,
            participantStatus: form.participantStatus || undefined,
            discontinuationReason: form.discontinuationReason || undefined,
            reason: form.reason || undefined,
          }
        });
      } else {
        await createMutation.mutateAsync({
          data: {
            screeningId,
            terminationDate: form.terminationDate,
            participantStatus: form.participantStatus,
            discontinuationReason: form.discontinuationReason || undefined,
          }
        });
      }
      await qc.invalidateQueries({ queryKey: getGetCloseoutQueryKey(screeningId) });
      setEditing(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save closeout record");
    }
  };

  const handleDelete = async (reason: string) => {
    await deleteMutation.mutateAsync({ screeningId, data: { reason } });
    await qc.invalidateQueries({ queryKey: getGetCloseoutQueryKey(screeningId) });
  };

  const statusColor = (status?: string) => {
    if (!status) return "";
    if (status.startsWith("Completed")) return "bg-green-100 text-green-800 border-green-300";
    if (status === "Deceased") return "bg-red-100 text-red-800 border-red-300";
    return "bg-orange-100 text-orange-800 border-orange-300";
  };

  if (!closeout && !editing) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <p className="text-muted-foreground">No closeout record yet.</p>
          {user?.role === "data_manager" && (
            <Button onClick={() => setEditing(true)}><Plus className="w-4 h-4 mr-2" />Record Closeout</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{closeout ? "Edit Closeout" : "New Closeout"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Termination Date *">
                <Input type="date" value={form.terminationDate} onChange={setInput("terminationDate")} required />
              </FormField>
              <FormField label="Participant Status *">
                <Select value={form.participantStatus} onValueChange={set("participantStatus")}>
                  <SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
            </div>
            {form.participantStatus && form.participantStatus !== "Completed - Delivered" && (
              <FormField label="Discontinuation Reason">
                <Textarea
                  value={form.discontinuationReason}
                  onChange={setInput("discontinuationReason")}
                  rows={3}
                  placeholder="Describe the reason for discontinuation..."
                />
              </FormField>
            )}
            {closeout && (
              <FormField label="Reason for Edit *">
                <Textarea value={form.reason} onChange={setInput("reason")} rows={2} placeholder="Required for audit trail..." />
              </FormField>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || !form.participantStatus || !form.terminationDate}>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Closeout Record</CardTitle>
            {closeout?.participantStatus && (
              <span className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold ${statusColor(closeout.participantStatus)}`}>
                {closeout.participantStatus}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <FieldRow label="Termination Date" value={closeout?.terminationDate} />
          <FieldRow label="Participant Status" value={closeout?.participantStatus} />
          {closeout?.discontinuationReason && (
            <FieldRow label="Discontinuation Reason" value={closeout?.discontinuationReason} />
          )}
          <FieldRow label="Recorded By" value={closeout?.createdBy} />
          <FieldRow label="Created" value={closeout ? new Date(closeout.createdAt).toLocaleString() : null} />
        </CardContent>
      </Card>
    </div>
  );
}
