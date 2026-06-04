import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateDelivery, useUpdateDelivery, useDeleteDelivery,
  getGetDeliveryQueryKey,
  type Delivery
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

const DELIVERY_PLACES = ["Bondo Hospital", "Siaya Hospital", "Kuoyo Health Centre", "Lumumba Health Centre", "Home", "Other"];
const DELIVERY_MODES = ["SVD", "Caesarean Section", "Assisted Vaginal", "Other"];
const YES_NO = ["Yes", "No"];

export default function DeliveryTab({ screeningId, delivery }: { screeningId: string; delivery?: Delivery }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    motherWeight: "", temperature: "", respRate: "", pulseRate: "", bloodPressure: "",
    oxygenSaturation: "", physicalAbnormality: "", abnormalityDetails: "",
    deliveryDate: "", deliveryTime: "", deliveryPlace: "", deliveredBy: "",
    deliveryMode: "", csectionIndication: "", reason: "",
  });

  useEffect(() => {
    if (delivery) {
      setForm({
        motherWeight: delivery.motherWeight?.toString() || "",
        temperature: delivery.temperature?.toString() || "",
        respRate: delivery.respRate?.toString() || "",
        pulseRate: delivery.pulseRate?.toString() || "",
        bloodPressure: delivery.bloodPressure || "",
        oxygenSaturation: delivery.oxygenSaturation?.toString() || "",
        physicalAbnormality: delivery.physicalAbnormality || "",
        abnormalityDetails: delivery.abnormalityDetails || "",
        deliveryDate: delivery.deliveryDate || "",
        deliveryTime: delivery.deliveryTime || "",
        deliveryPlace: delivery.deliveryPlace || "",
        deliveredBy: delivery.deliveredBy || "",
        deliveryMode: delivery.deliveryMode || "",
        csectionIndication: delivery.csectionIndication || "",
        reason: "",
      });
    }
  }, [delivery]);

  const createMutation = useCreateDelivery();
  const updateMutation = useUpdateDelivery();
  const deleteMutation = useDeleteDelivery();

  const set = (key: keyof typeof form) => (value: string) => setForm(f => ({ ...f, [key]: value }));
  const setInput = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = {
      motherWeight: form.motherWeight ? parseFloat(form.motherWeight) : undefined,
      temperature: form.temperature ? parseFloat(form.temperature) : undefined,
      respRate: form.respRate ? parseInt(form.respRate) : undefined,
      pulseRate: form.pulseRate ? parseInt(form.pulseRate) : undefined,
      bloodPressure: form.bloodPressure || undefined,
      oxygenSaturation: form.oxygenSaturation ? parseFloat(form.oxygenSaturation) : undefined,
      physicalAbnormality: form.physicalAbnormality || undefined,
      abnormalityDetails: form.abnormalityDetails || undefined,
      deliveryDate: form.deliveryDate || undefined,
      deliveryTime: form.deliveryTime || undefined,
      deliveryPlace: form.deliveryPlace || undefined,
      deliveredBy: form.deliveredBy || undefined,
      deliveryMode: form.deliveryMode || undefined,
      csectionIndication: form.csectionIndication || undefined,
    };
    try {
      if (delivery) {
        await updateMutation.mutateAsync({ screeningId, data: { ...payload, reason: form.reason || undefined } });
      } else {
        await createMutation.mutateAsync({ data: { screeningId, ...payload } });
      }
      await qc.invalidateQueries({ queryKey: getGetDeliveryQueryKey(screeningId) });
      setEditing(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save delivery record");
    }
  };

  const handleDelete = async (reason: string) => {
    await deleteMutation.mutateAsync({ screeningId, data: { reason } });
    await qc.invalidateQueries({ queryKey: getGetDeliveryQueryKey(screeningId) });
  };

  if (!delivery && !editing) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <p className="text-muted-foreground">No delivery record yet.</p>
          {user?.role === "data_manager" && (
            <Button onClick={() => setEditing(true)}><Plus className="w-4 h-4 mr-2" />Record Delivery</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{delivery ? "Edit Delivery Record" : "New Delivery Record"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delivery Details</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField label="Delivery Date">
                <Input type="date" value={form.deliveryDate} onChange={setInput("deliveryDate")} />
              </FormField>
              <FormField label="Delivery Time">
                <Input type="time" value={form.deliveryTime} onChange={setInput("deliveryTime")} />
              </FormField>
              <FormField label="Delivery Place">
                <Select value={form.deliveryPlace} onValueChange={set("deliveryPlace")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{DELIVERY_PLACES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Delivered By">
                <Input value={form.deliveredBy} onChange={setInput("deliveredBy")} placeholder="Name of clinician" />
              </FormField>
              <FormField label="Delivery Mode">
                <Select value={form.deliveryMode} onValueChange={set("deliveryMode")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{DELIVERY_MODES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              {form.deliveryMode === "Caesarean Section" && (
                <FormField label="C-Section Indication">
                  <Input value={form.csectionIndication} onChange={setInput("csectionIndication")} placeholder="Indication..." />
                </FormField>
              )}
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">Maternal Vitals</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField label="Mother Weight (kg)">
                <Input type="number" step="0.1" value={form.motherWeight} onChange={setInput("motherWeight")} />
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
              <FormField label="O₂ Saturation (%)">
                <Input type="number" step="0.1" value={form.oxygenSaturation} onChange={setInput("oxygenSaturation")} />
              </FormField>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">Physical Examination</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Physical Abnormality">
                <Select value={form.physicalAbnormality} onValueChange={set("physicalAbnormality")}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{YES_NO.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              {form.physicalAbnormality === "Yes" && (
                <FormField label="Abnormality Details">
                  <Input value={form.abnormalityDetails} onChange={setInput("abnormalityDetails")} placeholder="Describe..." />
                </FormField>
              )}
            </div>
            {delivery && (
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
          <CardHeader><CardTitle className="text-base">Delivery Details</CardTitle></CardHeader>
          <CardContent>
            <FieldRow label="Delivery Date" value={delivery?.deliveryDate} />
            <FieldRow label="Delivery Time" value={delivery?.deliveryTime} />
            <FieldRow label="Delivery Place" value={delivery?.deliveryPlace} />
            <FieldRow label="Delivered By" value={delivery?.deliveredBy} />
            <FieldRow label="Delivery Mode" value={delivery?.deliveryMode} />
            {delivery?.deliveryMode === "Caesarean Section" && (
              <FieldRow label="C-Section Indication" value={delivery?.csectionIndication} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Maternal Vitals</CardTitle></CardHeader>
          <CardContent>
            <FieldRow label="Mother Weight (kg)" value={delivery?.motherWeight} />
            <FieldRow label="Temperature (°C)" value={delivery?.temperature} />
            <FieldRow label="Resp Rate (/min)" value={delivery?.respRate} />
            <FieldRow label="Pulse Rate (/min)" value={delivery?.pulseRate} />
            <FieldRow label="Blood Pressure" value={delivery?.bloodPressure} />
            <FieldRow label="O₂ Saturation (%)" value={delivery?.oxygenSaturation} />
            <FieldRow label="Physical Abnormality" value={delivery?.physicalAbnormality} />
            {delivery?.physicalAbnormality === "Yes" && (
              <FieldRow label="Abnormality Details" value={delivery?.abnormalityDetails} />
            )}
            <FieldRow label="Recorded By" value={delivery?.createdBy} />
            <FieldRow label="Created" value={delivery ? new Date(delivery.createdAt).toLocaleString() : null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
