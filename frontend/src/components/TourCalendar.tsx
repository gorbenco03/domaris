import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";
import { Check, X, Clock, User, Mail, Phone, MapPin } from "lucide-react";

type TourRequestStatus = "Pending" | "Accepted" | "Declined";

interface TourRequest {
  id: number;
  propertyId: number;
  propertyTitle: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  message?: string;
  status: TourRequestStatus;
}

interface TourCalendarProps {
  tourRequests: TourRequest[];
  onAcceptRequest: (requestId: number) => void;
  onDeclineRequest: (requestId: number) => void;
}

export default function TourCalendar({
  tourRequests,
  onAcceptRequest,
  onDeclineRequest,
}: TourCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getTourStatusVariant = (status: TourRequestStatus) => {
    switch (status) {
      case "Pending":
        return "default";
      case "Accepted":
        return "default";
      case "Declined":
        return "destructive";
      default:
        return "default";
    }
  };

  // Get tours for a specific date
  const getToursForDate = (date: Date) => {
    return tourRequests.filter((request) => {
      const requestDate = parseISO(request.date);
      return isSameDay(requestDate, date);
    });
  };





  const selectedDateTours = selectedDate ? getToursForDate(selectedDate) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tour Calendar</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className={cn("p-3 pointer-events-auto")}
            modifiersStyles={{
              hasTours: {
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                fontWeight: "bold",
                borderRadius: "0.375rem",
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? `Tours on ${format(selectedDate, "MMMM d, yyyy")}`
              : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateTours.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tours scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateTours.map((tour) => (
                <Card key={tour.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold text-foreground">
                              {tour.propertyTitle}
                            </h4>
                          </div>
                          <Badge variant={getTourStatusVariant(tour.status)}>
                            {tour.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <Clock className="h-4 w-4" />
                          {tour.time}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{tour.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${tour.email}`}
                            className="text-primary hover:underline"
                          >
                            {tour.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`tel:${tour.phone}`}
                            className="text-primary hover:underline"
                          >
                            {tour.phone}
                          </a>
                        </div>
                      </div>

                      {tour.message && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm text-foreground italic">
                            "{tour.message}"
                          </p>
                        </div>
                      )}

                      {tour.status === "Pending" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => onAcceptRequest(tour.id)}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDeclineRequest(tour.id)}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Decline
                          </Button>
                        </div>
                      )}
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
