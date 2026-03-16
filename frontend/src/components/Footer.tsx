import Link from "next/link";
import { MapPin, Phone, Mail, Facebook, Instagram, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 inline-block text-2xl font-bold text-primary">RIVA</Link>
            <p className="mb-4 text-sm text-muted-foreground">
              Găsește-ți casa visurilor direct de la proprietari, fără comisioane.
            </p>
            <div className="flex gap-3">
              <a href="#" className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Proprietăți</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/search?type=apartment" className="hover:text-accent">Apartamente</Link></li>
              <li><Link href="/search?type=house" className="hover:text-accent">Case & Vile</Link></li>
              <li><Link href="/search?type=commercial" className="hover:text-accent">Spații comerciale</Link></li>
              <li><Link href="/search?type=land" className="hover:text-accent">Terenuri</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Companie</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-accent">Despre noi</Link></li>
              <li><Link href="/careers" className="hover:text-accent">Cariere</Link></li>
              <li><Link href="/blog" className="hover:text-accent">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-accent">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                Chișinău, Republica Moldova
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                +373 XX XXX XXX
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                contact@riva.md
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 RIVA. Toate drepturile rezervate.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-accent">Termeni și Condiții</Link>
            <Link href="/privacy" className="hover:text-accent">Politica de Confidențialitate</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
