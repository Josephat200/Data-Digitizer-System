import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteDialogProps {
  onConfirm: (reason: string) => void;
  trigger?: React.ReactNode;
}

export function DeleteDialog({ onConfirm, trigger }: DeleteDialogProps) {
  const [reason, setReason] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason);
    setOpen(false);
    setReason("");
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || <Button variant="destructive">Delete</Button>}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Please provide a reason for deleting this record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="reason" className="mb-2 block">Reason for deletion <span className="text-destructive">*</span></Label>
          <Input 
            id="reason"
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="Enter reason..." 
            autoFocus
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason("")}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Record
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
