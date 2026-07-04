"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentModalPlan {
  name: string;
  price: number;
  currency: string;
  description?: string;
  durationLabel?: string;
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PaymentModalPlan | null;
  /** Called with the API action. Should return a promise. On success the modal calls onSuccess. */
  onPay: () => Promise<void>;
  onSuccess: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentModal({
  open,
  onOpenChange,
  plan,
  onPay,
  onSuccess,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleClose = (nextOpen: boolean) => {
    if (isLoading) return; // don't close while request is in-flight
    if (!nextOpen) setSucceeded(false);
    onOpenChange(nextOpen);
  };

  const handlePay = async () => {
    if (!plan) return;
    setIsLoading(true);
    try {
      await onPay();
      setSucceeded(true);
      toast.success("Plată procesată cu succes!");
      // Small delay so the user sees the success state
      setTimeout(() => {
        onOpenChange(false);
        setSucceeded(false);
        onSuccess();
      }, 1200);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Nu am putut procesa plata.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizare plată</DialogTitle>
          {plan && (
            <DialogDescription>
              {plan.description ?? plan.name}
            </DialogDescription>
          )}
        </DialogHeader>

        {plan && (
          <div className="space-y-5">
            {/* Rezumat plan */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{plan.name}</span>
                <span className="text-lg font-bold text-primary">
                  {plan.price} {plan.currency}
                </span>
              </div>
              {plan.durationLabel && (
                <p className="text-xs text-muted-foreground">{plan.durationLabel}</p>
              )}
            </div>

            {/* Metodă de plată (simulată) */}
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Plată simulată</p>
                  <p className="text-xs text-muted-foreground">
                    Acesta este un mediu demo — nicio sumă reală nu va fi debitată.
                  </p>
                </div>
              </div>
            </div>

            {/* Buton */}
            {succeeded ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-4 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Plată confirmată!</span>
              </div>
            ) : (
              <Button
                onClick={handlePay}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-5 w-5" />
                )}
                {isLoading ? "Se procesează..." : `Plătește (simulat) — ${plan.price} ${plan.currency}`}
              </Button>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Apăsând „Plătește (simulat)" confirmi că ești de acord cu termenii serviciului.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PaymentModal;
