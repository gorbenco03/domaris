"use client";

/**
 * RIVA Frontend - Availability Settings Page
 * Owner sets weekly availability for property viewings
 * Aligned with mobile/src/features/viewings/screens/AvailabilitySettingsScreen.tsx
 */

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  Save,
  Loader2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DayAvailability {
  dayOfWeek: number;
  enabled: boolean;
  slots: TimeSlot[];
}

const DAYS = [
  { value: 1, label: "Luni", short: "L" },
  { value: 2, label: "Marți", short: "Ma" },
  { value: 3, label: "Miercuri", short: "Mi" },
  { value: 4, label: "Joi", short: "J" },
  { value: 5, label: "Vineri", short: "V" },
  { value: 6, label: "Sâmbătă", short: "S" },
  { value: 0, label: "Duminică", short: "D" },
];

const TIME_OPTIONS = Array.from({ length: 15 }, (_, i) => i + 7).flatMap((h) =>
  [0, 30].map((m) => `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
);

const DEFAULT_AVAILABILITY: DayAvailability[] = [
  { dayOfWeek: 1, enabled: true, slots: [{ startTime: "09:00", endTime: "12:00" }, { startTime: "14:00", endTime: "18:00" }] },
  { dayOfWeek: 2, enabled: true, slots: [{ startTime: "10:00", endTime: "14:00" }] },
  { dayOfWeek: 3, enabled: true, slots: [{ startTime: "09:00", endTime: "18:00" }] },
  { dayOfWeek: 4, enabled: false, slots: [] },
  { dayOfWeek: 5, enabled: true, slots: [{ startTime: "10:00", endTime: "16:00" }] },
  { dayOfWeek: 6, enabled: true, slots: [{ startTime: "10:00", endTime: "13:00" }] },
  { dayOfWeek: 0, enabled: false, slots: [] },
];

// ============================================
// COMPONENT
// ============================================

export default function AvailabilitySettingsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [availability, setAvailability] = useState<DayAvailability[]>(DEFAULT_AVAILABILITY);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState("30");

  const updateDay = (dayOfWeek: number, updates: Partial<DayAvailability>) => {
    setAvailability((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...updates } : d))
    );
  };

  const addSlot = (dayOfWeek: number) => {
    const day = availability.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) return;
    const lastSlot = day.slots[day.slots.length - 1];
    const startTime = lastSlot ? lastSlot.endTime : "09:00";
    const startHour = parseInt(startTime.split(":")[0]);
    const endTime = `${Math.min(startHour + 2, 21).toString().padStart(2, "0")}:00`;
    updateDay(dayOfWeek, { slots: [...day.slots, { startTime, endTime }] });
  };

  const removeSlot = (dayOfWeek: number, slotIndex: number) => {
    const day = availability.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) return;
    updateDay(dayOfWeek, { slots: day.slots.filter((_, i) => i !== slotIndex) });
  };

  const updateSlot = (dayOfWeek: number, slotIndex: number, field: "startTime" | "endTime", value: string) => {
    const day = availability.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) return;
    const newSlots = day.slots.map((s, i) => (i === slotIndex ? { ...s, [field]: value } : s));
    updateDay(dayOfWeek, { slots: newSlots });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // No backend persistence endpoint yet — be honest rather than fake a save.
      toast.info("Salvarea disponibilității va fi activată în curând.");
    } catch {
      toast.error("Nu am putut salva disponibilitatea.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalSlots = availability.reduce((sum, d) => sum + (d.enabled ? d.slots.length : 0), 0);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Calendar className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <Button asChild className="mt-6"><Link href="/auth">Autentifică-te</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link href="/viewings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi la vizionări
          </Link>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Disponibilitate</h1>
            <p className="mt-1 text-muted-foreground">Setează când ești disponibil pentru vizionări</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{totalSlots} intervale active</p>
          </div>
        </div>

        {/* Default Duration */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Durata vizionării</p>
                <p className="text-sm text-muted-foreground">Durata implicită per vizionare</p>
              </div>
            </div>
            <Select value={defaultDuration} onValueChange={setDefaultDuration}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="space-y-4">
          {DAYS.map((day) => {
            const dayData = availability.find((d) => d.dayOfWeek === day.value)!;
            return (
              <div
                key={day.value}
                className={cn(
                  "rounded-2xl border bg-card p-5 transition-colors",
                  dayData.enabled ? "border-border" : "border-border/50 opacity-60"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {day.short}
                    </span>
                    <span className="font-medium">{day.label}</span>
                  </div>
                  <Switch
                    checked={dayData.enabled}
                    onCheckedChange={(checked) => updateDay(day.value, { enabled: checked })}
                  />
                </div>

                {dayData.enabled && (
                  <div className="space-y-2 ml-12">
                    {dayData.slots.map((slot, slotIdx) => (
                      <div key={slotIdx} className="flex items-center gap-2">
                        <Select
                          value={slot.startTime}
                          onValueChange={(v) => updateSlot(day.value, slotIdx, "startTime", v)}
                        >
                          <SelectTrigger className="w-24 h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">—</span>
                        <Select
                          value={slot.endTime}
                          onValueChange={(v) => updateSlot(day.value, slotIdx, "endTime", v)}
                        >
                          <SelectTrigger className="w-24 h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.filter((t) => t > slot.startTime).map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => removeSlot(day.value, slotIdx)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addSlot(day.value)}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adaugă interval
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvează disponibilitatea
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
