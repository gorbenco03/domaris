"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  BedDouble,
  Maximize2,
  Building,
  Calendar as CalendarIcon,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const propertyImages = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&auto=format&fit=crop",
];

const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

// Mock owner data
const ownerData = {
  id: "owner-1",
  name: "Alexandru Munteanu",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop",
  phone: "+373 69 123 456",
  email: "alex.munteanu@email.com",
  isVerified: true,
  memberSince: "Ianuarie 2024",
  totalListings: 4,
};

// Mock other properties from same owner
const ownerProperties = [
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&auto=format&fit=crop",
    price: "89.500 €",
    priceType: "sale" as const,
    title: "Apartament 2 camere - Centru",
    location: "Strada Ștefan cel Mare, Chișinău",
    rooms: 2,
    baths: 1,
    area: 58,
    tags: ["Nou"],
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&auto=format&fit=crop",
    price: "450 €",
    priceType: "rent" as const,
    title: "Apartament 3 camere - Botanica",
    location: "Bulevardul Dacia, Chișinău",
    rooms: 3,
    baths: 1,
    area: 75,
    tags: ["Chirie"],
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop",
    price: "155.000 €",
    priceType: "sale" as const,
    title: "Casă cu curte - Durlești",
    location: "Strada Livezilor, Durlești",
    rooms: 4,
    baths: 2,
    area: 180,
    tags: ["Casă"],
  },
];

export default function PropertyDetailPage() {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % propertyImages.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + propertyImages.length) % propertyImages.length);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setBookingStep(2);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setBookingStep(3);
  };

  const handleConfirmBooking = () => {
    if (selectedDate && selectedTime) {
      toast.success("Vizionare programată cu succes!", {
        description: `${format(selectedDate, "d MMMM yyyy", { locale: ro })} la ora ${selectedTime}`,
      });
      // Reset
      setSelectedDate(undefined);
      setSelectedTime(null);
      setBookingStep(1);
    }
  };

  const handleBackStep = () => {
    if (bookingStep === 2) {
      setBookingStep(1);
      setSelectedTime(null);
    } else if (bookingStep === 3) {
      setBookingStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Image Gallery */}
        <div className="relative">
          <div className="relative h-[50vh] overflow-hidden bg-muted lg:h-[60vh]">
            <img
              src={propertyImages[currentImage]}
              alt="Property"
              className="h-full w-full object-cover"
            />
            
            {/* Navigation Arrows */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-card/90 p-3 text-foreground backdrop-blur-sm transition-all hover:bg-card"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-card/90 p-3 text-foreground backdrop-blur-sm transition-all hover:bg-card"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 rounded-full bg-card/90 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
              {currentImage + 1} / {propertyImages.length}
            </div>

            {/* Top Actions */}
            <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                <Link
                  href="/search"
                className="rounded-full bg-card/90 p-3 text-foreground backdrop-blur-sm transition-all hover:bg-card"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex gap-2">
                <button className="rounded-full bg-card/90 p-3 text-foreground backdrop-blur-sm transition-all hover:bg-card">
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={cn(
                    "rounded-full bg-card/90 p-3 backdrop-blur-sm transition-all hover:bg-card",
                    isFavorite ? "text-destructive" : "text-foreground"
                  )}
                >
                  <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 lg:px-8">
            {propertyImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImage(idx)}
                className={cn(
                  "h-20 w-28 shrink-0 overflow-hidden rounded-lg transition-all",
                  currentImage === idx
                    ? "ring-2 ring-accent ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                )}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Info */}
            <div className="lg:col-span-2">
              {/* Tags */}
              <div className="mb-4 flex gap-2">
                <span className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                  De vânzare
                </span>
                <span className="rounded-md bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                  Apartament
                </span>
              </div>

              {/* Title & Location */}
              <h1 className="mb-2 text-3xl font-bold text-foreground lg:text-4xl">
                Spațiu 5 camere - Tineretului
              </h1>
              <div className="mb-6 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5 text-accent" />
                <span>Strada Tineretului nr. 28, Tineretului, București</span>
              </div>

              {/* Price */}
              <div className="mb-8">
                <p className="text-4xl font-bold text-primary">203.910 €</p>
              </div>

              {/* Specs Grid */}
              <div className="mb-8 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-4">
                <div className="text-center">
                  <BedDouble className="mx-auto mb-2 h-8 w-8 text-accent" />
                  <p className="text-2xl font-bold text-foreground">5</p>
                  <p className="text-sm uppercase text-muted-foreground">Camere</p>
                </div>
                <div className="text-center">
                  <Maximize2 className="mx-auto mb-2 h-8 w-8 text-accent" />
                  <p className="text-2xl font-bold text-foreground">142 m²</p>
                  <p className="text-sm uppercase text-muted-foreground">Suprafață</p>
                </div>
                <div className="text-center">
                  <Building className="mx-auto mb-2 h-8 w-8 text-accent" />
                  <p className="text-2xl font-bold text-foreground">3/11</p>
                  <p className="text-sm uppercase text-muted-foreground">Etaj</p>
                </div>
                <div className="text-center">
                  <CalendarIcon className="mx-auto mb-2 h-8 w-8 text-accent" />
                  <p className="text-2xl font-bold text-foreground">1982</p>
                  <p className="text-sm uppercase text-muted-foreground">An constr.</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">Descriere</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p>
                    Apartament spațios cu 5 camere situat în zona Tineretului, într-un bloc cu 
                    acces facil la transportul public și aproape de parcul Tineretului. 
                    Proprietatea beneficiază de o suprafață generoasă de 142 mp și este 
                    perfect pentru o familie mare sau pentru a fi transformat în spațiu de birouri.
                  </p>
                  <p className="mt-4">
                    Imobilul dispune de 5 camere luminoase, 2 băi, bucătărie separată și balcon. 
                    Recent renovat cu materiale de calitate superioară.
                  </p>
                </div>
              </div>

              {/* Features */}
              <div>
                <h2 className="mb-4 text-xl font-semibold text-foreground">Facilități</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    "Balcon",
                    "Centrală termică",
                    "Aer condiționat",
                    "Loc parcare",
                    "Lift",
                    "Termopan",
                    "Gresie/Faianță",
                    "Parchet",
                    "Bucătărie utilată",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-foreground">
                      <Check className="h-5 w-5 text-accent" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-6 text-lg font-semibold text-foreground">
                  Programează vizionare
                </h3>

                {/* Property Summary */}
                <div className="mb-6 flex gap-4 rounded-xl bg-muted p-4">
                  <div className="h-16 w-20 overflow-hidden rounded-lg bg-secondary">
                    <img
                      src={propertyImages[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Spațiu 5 camere - Tineretului</p>
                    <p className="text-sm text-muted-foreground">
                      <MapPin className="mr-1 inline h-3 w-3" />
                      Strada Tineretului nr. 28
                    </p>
                  </div>
                </div>

                {/* Steps */}
                <div className="mb-6 flex items-center justify-center gap-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                          bookingStep >= step
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {step === 1 && <CalendarIcon className="h-5 w-5" />}
                        {step === 2 && <Clock className="h-5 w-5" />}
                        {step === 3 && <Check className="h-5 w-5" />}
                      </div>
                      {step < 3 && (
                        <div
                          className={cn(
                            "h-0.5 w-8 transition-colors",
                            bookingStep > step ? "bg-primary" : "bg-muted"
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mb-6 flex justify-between text-xs text-muted-foreground">
                  <span>Data</span>
                  <span>Ora</span>
                  <span>Confirmare</span>
                </div>

                {/* Step 1: Calendar */}
                {bookingStep === 1 && (
                  <div className="space-y-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      Alege data vizionării
                    </p>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      className="rounded-xl border pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </div>
                )}

                {/* Step 2: Time Slots */}
                {bookingStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Clock className="h-4 w-4" />
                        Alege ora vizionării
                      </p>
                      <button
                        onClick={handleBackStep}
                        className="text-sm text-primary hover:underline"
                      >
                        Schimbă data
                      </button>
                    </div>
                    
                    {selectedDate && (
                      <div className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                        📅 {format(selectedDate, "EEEE, d MMMM yyyy", { locale: ro })}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                            selectedTime === time
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-foreground hover:border-primary hover:bg-primary/10"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {bookingStep === 3 && (
                  <div className="space-y-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Check className="h-4 w-4" />
                      Confirmă vizionarea
                    </p>
                    
                    <div className="space-y-2 rounded-xl bg-muted p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-medium text-foreground">
                          {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: ro })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Ora:</span>
                        <span className="font-medium text-foreground">{selectedTime}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      size="lg"
                      onClick={handleConfirmBooking}
                    >
                      <Check className="mr-2 h-5 w-5" />
                      Confirmă vizionarea
                    </Button>

                    <button
                      onClick={handleBackStep}
                      className="w-full text-center text-sm text-primary hover:underline"
                    >
                      ← Înapoi la selectarea orei
                    </button>
                  </div>
                )}

                {/* Action Button for Step 1 */}
                {bookingStep === 1 && selectedDate && (
                  <Button
                    className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    size="lg"
                    onClick={() => setBookingStep(2)}
                  >
                    Continuă
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="lg" className="flex-1">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Mesaj
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Section */}
          <div className="mt-12 border-t border-border pt-12">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
                  <img
                    src={ownerData.avatar}
                    alt={ownerData.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {ownerData.name}
                    </h3>
                    {ownerData.isVerified && (
                      <BadgeCheck className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Membru din {ownerData.memberSince} · {ownerData.totalListings} anunțuri
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Phone className="mr-2 h-4 w-4" />
                  Sună
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
              </div>
            </div>

            {/* Other Properties from Owner */}
            <div>
              <h2 className="mb-6 text-xl font-semibold text-foreground">
                Alte proprietăți de la acest proprietar
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {ownerProperties.map((property) => (
                  <PropertyCard key={property.id} {...property} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
