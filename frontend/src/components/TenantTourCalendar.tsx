import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";
import { Clock, MapPin, X, Edit } from "lucide-react";
import { toast } from "sonner";

type TourStatus = "Scheduled" | "Cancelled";

interface Tour {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  date: string;
  time: string;
  landlordName: string;
  status: TourStatus;
}

interface TenantTourCalendarProps {
  tours: Tour[];
  onReschedule: (tourId: number, newDate: string, newTime: string) => void;
  onCancel: (tourId: number) => void;
}

export default function TenantTourCalendar({
  tours,
  onReschedule,
  onCancel,
}: TenantTourCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState("");

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00",
    "17:00", "18:00"
  ];

  const getToursForDate = (date: Date) => {
    return tours.filter((tour) => {
      const tourDate = parseISO(tour.date);
      return isSameDay(tourDate, date) && tour.status === "Scheduled";
    });
  };



  const selectedDateTours = selectedDate ? getToursForDate(selectedDate) : [];

  const handleRescheduleClick = (tour: Tour) => {
    setSelectedTour(tour);
    setNewDate(parseISO(tour.date));
    setNewTime(tour.time);
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleSubmit = () => {
    if (selectedTour && newDate && newTime) {
      onReschedule(selectedTour.id, format(newDate, "yyyy-MM-dd"), newTime);
      setRescheduleDialogOpen(false);
      toast.success("Tur reprogramat cu succes");
    }
  };

  const handleCancelTour = (tourId: number) => {
    onCancel(tourId);
    toast.success("Tur anulat");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Calendarul meu de tururi</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className={cn("p-3 pointer-events-auto")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? `Tururi pe ${format(selectedDate, "d MMMM yyyy")}`
              : "Selectează o dată"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateTours.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nu ai tururi programate pentru această dată</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateTours.map((tour) => (
                <Card key={tour.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold text-foreground">
                              {tour.propertyTitle}
                            </h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {tour.propertyAddress}
                          </p>
                          <Badge variant="default">Programat</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <Clock className="h-4 w-4" />
                          {tour.time}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Proprietar: <span className="text-foreground">{tour.landlordName}</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRescheduleClick(tour)}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Reprogramează
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reprogramează turul</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Data nouă</Label>
                                <Calendar
                                  mode="single"
                                  selected={newDate}
                                  onSelect={setNewDate}
                                  className={cn("p-3 pointer-events-auto border rounded-md")}
                                  disabled={(date) => date < new Date()}
                                />
                              </div>
                              <div>
                                <Label>Ora nouă</Label>
                                <select
                                  value={newTime}
                                  onChange={(e) => setNewTime(e.target.value)}
                                  className="w-full p-2 border rounded-md bg-background text-foreground"
                                >
                                  <option value="">Selectează ora</option>
                                  {timeSlots.map((slot) => (
                                    <option key={slot} value={slot}>
                                      {slot}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <Button onClick={handleRescheduleSubmit} className="w-full">
                                Confirmă reprogramarea
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelTour(tour.id)}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Anulează
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
