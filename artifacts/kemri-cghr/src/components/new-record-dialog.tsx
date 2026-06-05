import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListEligibleScreenings,
  useListEnrolledScreenings,
  type ScreeningSummary,
} from "@workspace/api-client-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowRight, User, AlertCircle } from "lucide-react";

type RecordType = "enrolment" | "anc" | "delivery" | "closeout";

const CONFIG: Record<RecordType, { title: string; emptyMsg: string; pool: "eligible" | "enrolled" }> = {
  enrolment: {
    title: "New Enrolment — Select Participant",
    emptyMsg: "No eligible participants available. Screen and mark participants as Eligible + Consented first.",
    pool: "eligible",
  },
  anc: {
    title: "New ANC Visit — Select Participant",
    emptyMsg: "No enrolled participants yet. Enrol a participant first.",
    pool: "enrolled",
  },
  delivery: {
    title: "New Delivery Record — Select Participant",
    emptyMsg: "No enrolled participants yet. Enrol a participant first.",
    pool: "enrolled",
  },
  closeout: {
    title: "New Closeout — Select Participant",
    emptyMsg: "No participants to close out.",
    pool: "enrolled",
  },
};

function ParticipantList({
  type,
  onSelect,
}: {
  type: RecordType;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const cfg = CONFIG[type];

  const { data: eligible, isLoading: loadingEl } = useListEligibleScreenings({
    query: { enabled: cfg.pool === "eligible" },
  });
  const { data: enrolled, isLoading: loadingEn } = useListEnrolledScreenings({
    query: { enabled: cfg.pool === "enrolled" },
  });

  const all: ScreeningSummary[] = (cfg.pool === "eligible" ? eligible : enrolled) ?? [];
  const isLoading = cfg.pool === "eligible" ? loadingEl : loadingEn;

  const filtered = all.filter(
    (p) =>
      !search ||
      p.screeningId.toLowerCase().includes(search.toLowerCase()) ||
      p.healthFacility.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3 mt-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by ID or facility..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-8 px-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6 opacity-40" />
            <p>{search ? "No matching participants." : cfg.emptyMsg}</p>
          </div>
        ) : (
          filtered.map((p) => (
            <button
              key={p.screeningId}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              onClick={() => onSelect(p.screeningId)}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-primary">{p.screeningId}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.healthFacility}
                    {p.interviewDate ? ` · ${p.interviewDate}` : ""}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {filtered.length} participant{filtered.length !== 1 ? "s" : ""} shown
        </p>
      )}
    </div>
  );
}

export function NewRecordDialog({
  type,
  trigger,
}: {
  type: RecordType;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const cfg = CONFIG[type];

  const handleSelect = (screeningId: string) => {
    setOpen(false);
    navigate(`/screening/${screeningId}?tab=${type}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {cfg.title}
          </DialogTitle>
        </DialogHeader>
        <ParticipantList type={type} onSelect={handleSelect} />
      </DialogContent>
    </Dialog>
  );
}
