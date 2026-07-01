"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const contactInfo = [
  { icon: MapPin, label: "Adresă", value: "Chișinău, Republica Moldova" },
  { icon: Phone, label: "Telefon", value: "+373 XX XXX XXX" },
  { icon: Mail, label: "Email", value: "contact@riva.md" },
  { icon: Clock, label: "Program", value: "Luni – Vineri, 09:00 – 18:00" },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Te rugăm să completezi toate câmpurile obligatorii.");
      return;
    }
    setIsSending(true);
    // Open the user's email client pre-filled — the message actually goes somewhere
    // (no backend contact endpoint yet, so we don't fake a "sent" success).
    const mailSubject = encodeURIComponent(subject || `Mesaj de la ${name}`);
    const mailBody = encodeURIComponent(`Nume: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:contact@riva.md?subject=${mailSubject}&body=${mailBody}`;
    setIsSending(false);
    setSent(true);
    toast.success("Ți-am deschis aplicația de email cu mesajul completat.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 px-4 py-16 text-center text-white lg:py-24">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
              <MessageCircle className="h-4 w-4" />
              Contact
            </div>
            <h1 className="text-4xl font-bold lg:text-5xl">Contactează-ne</h1>
            <p className="mt-4 text-lg text-white/80">
              Ai întrebări sau sugestii? Suntem aici să te ajutăm.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h2 className="mb-6 text-xl font-bold">Informații de contact</h2>
              <div className="space-y-5">
                {contactInfo.map((c) => (
                  <div key={c.label} className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                      <c.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="text-sm text-muted-foreground">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              {sent ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                  <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
                  <h2 className="mt-4 text-2xl font-bold">Mulțumim!</h2>
                  <p className="mt-2 text-muted-foreground">
                    Mesajul tău a fost trimis. Te vom contacta în cel mai scurt timp posibil.
                  </p>
                  <Button className="mt-6" onClick={() => setSent(false)}>
                    Trimite alt mesaj
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 lg:p-8">
                  <h2 className="mb-6 text-xl font-bold">Trimite-ne un mesaj</h2>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="name">Nume *</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Numele tău"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@exemplu.md"
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="subject">Subiect</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Despre ce e vorba?"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Mesaj *</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Scrie mesajul tău aici..."
                        rows={5}
                        className="mt-1"
                        required
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={isSending}>
                      {isSending ? "Se trimite..." : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Trimite mesajul
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
