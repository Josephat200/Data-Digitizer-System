import { Badge } from "@/components/ui/badge";

export function ParticipantStatusBadge({ eligible, consented }: { eligible?: string | null, consented?: string | null }) {
  if (eligible === "Yes" && consented === "Yes") {
    return <Badge className="bg-green-500 hover:bg-green-600">Eligible & Consented</Badge>;
  }
  if (eligible === "No") {
    return <Badge variant="destructive">Ineligible</Badge>;
  }
  if (eligible === "Yes" && consented === "No") {
    return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30">Refused Consent</Badge>;
  }
  return <Badge variant="outline" className="bg-muted">Pending</Badge>;
}
