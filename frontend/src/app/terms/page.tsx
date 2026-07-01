"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Termeni și Condiții</h1>
        </div>

        <div className="prose prose-sm max-w-none rounded-2xl border border-border bg-card p-8 text-foreground">
          <p className="text-sm text-muted-foreground mb-6">
            Ultima actualizare: 25 iunie 2026
          </p>

          <p className="mb-6">
            Vă rugăm să citiți cu atenție prezentele Termeni și Condiții (<strong>„T&C"</strong>) înainte de a utiliza platforma RIVA, operată de <strong>Domaris SRL</strong>, înregistrată în Republica Moldova (<strong>„Domaris"</strong>, <strong>„noi"</strong>, <strong>„platforma"</strong>). Prin crearea unui cont sau utilizarea oricărei funcționalități a platformei, acceptați fără rezerve prezentele T&C. Dacă nu sunteți de acord, vă rugăm să nu utilizați platforma.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">1. Definiții</h2>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li><strong>„Utilizator"</strong> — orice persoană fizică sau juridică care accesează sau utilizează platforma RIVA.</li>
            <li><strong>„Proprietar"</strong> — utilizatorul care publică un anunț imobiliar pe platformă.</li>
            <li><strong>„Cumpărător/Chiriaș"</strong> — utilizatorul interesat de un anunț publicat.</li>
            <li><strong>„Anunț"</strong> — o listare imobiliară publicată de un Proprietar.</li>
            <li><strong>„KYC"</strong> — procesul de verificare a identității și/sau a documentelor de proprietate.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">2. Descrierea platformei</h2>
          <p className="mb-4">
            RIVA este un marketplace imobiliar peer-to-peer care permite persoanelor fizice să publice și să descopere oferte imobiliare (vânzare sau închiriere) în Republica Moldova, fără intermediere obligatorie. Platforma nu este parte la tranzacțiile imobiliare desfășurate între utilizatori și nu oferă servicii de agenție imobiliară.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">3. Eligibilitate și înregistrare</h2>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Platforma este destinată exclusiv persoanelor cu vârsta de minimum <strong>18 ani</strong>.</li>
            <li>Datele furnizate la înregistrare trebuie să fie reale, complete și actualizate.</li>
            <li>Fiecare persoană poate deține un singur cont activ. Conturile multiple create cu scopul de a eluda restricțiile platformei vor fi suspendate.</li>
            <li>Sunteți responsabil pentru securitatea parolei și a sesiunii de autentificare.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">4. Publicarea anunțurilor</h2>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Anunțurile trebuie să descrie cu acuratețe proprietatea oferită. Informațiile false, înșelătoare sau incomplete sunt interzise.</li>
            <li>Este interzisă publicarea anunțurilor pentru proprietăți pe care nu le dețineți sau pentru care nu aveți dreptul legal de a le închiria ori vinde.</li>
            <li>Imaginile utilizate trebuie să reprezinte efectiv proprietatea respectivă și să nu înfrângă drepturile de autor ale terților.</li>
            <li>Prețul afișat trebuie să fie real. Prețurile cu caracter speculativ sau înșelător pot atrage suspendarea anunțului.</li>
            <li>Ne rezervăm dreptul de a suspenda sau elimina orice anunț care nu respectă T&C sau legislația în vigoare, fără preaviz.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">5. Verificarea KYC</h2>
          <p className="mb-4">
            Proprietarii care doresc badge-ul <strong>„Proprietate verificată"</strong> pot transmite documente de identitate și/sau documente care atestă dreptul de proprietate. Procesul KYC este voluntar la această versiune a platformei. Domaris prelucrează documentele KYC exclusiv în scopul verificării și nu le divulgă terților, cu excepțiile prevăzute de lege.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">6. Conduita utilizatorilor</h2>
          <p className="mb-2">Este interzis orice comportament care:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Constituie fraudă, înșelăciune sau spălare de bani.</li>
            <li>Implică hărțuire, amenințări sau discriminare față de alți utilizatori.</li>
            <li>Utilizează platforma pentru activități comerciale neautorizate (spam, publicitate mascată etc.).</li>
            <li>Interferează cu infrastructura tehnică a platformei (atacuri informatice, scraping neautorizat etc.).</li>
            <li>Încalcă legislația în vigoare din Republica Moldova sau orice altă jurisdicție aplicabilă.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">7. Tranzacțiile între utilizatori</h2>
          <p className="mb-4">
            RIVA facilitează contactul între Proprietari și Cumpărători/Chiriași, dar <strong>nu este parte la nicio tranzacție imobiliară</strong>. Orice acord, contract de vânzare-cumpărare sau contract de închiriere se încheie exclusiv între utilizatori, în conformitate cu legislația civilă a Republicii Moldova. Recomandăm utilizarea unui notar public și verificarea documentelor de proprietate la Agenția Servicii Publice (ASP).
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">8. Limitarea răspunderii</h2>
          <p className="mb-4">
            Platforma este furnizată „ca atare" (<em>as is</em>). În limita permisă de lege:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Domaris nu garantează acuratețea, completitudinea sau legalitatea anunțurilor publicate de utilizatori.</li>
            <li>Domaris nu răspunde pentru prejudiciile directe sau indirecte rezultate din tranzacțiile încheiate între utilizatori.</li>
            <li>Domaris nu răspunde pentru întreruperile temporare ale serviciului cauzate de motive tehnice sau de forță majoră.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">9. Proprietate intelectuală</h2>
          <p className="mb-4">
            Toate elementele de design, brand, cod sursă și conținut editorial ale platformei RIVA sunt proprietatea Domaris SRL și sunt protejate de legislația privind drepturile de autor și mărcile înregistrate. Utilizatorii acordă platformei o licență neexclusivă, gratuită și mondială pentru a afișa conținutul publicat (anunțuri, imagini) în scopul operării serviciului.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">10. Ștergerea contului</h2>
          <p className="mb-4">
            Puteți solicita ștergerea contului oricând din secțiunea <strong>Setări → Securitate → Șterge cont</strong>. Ștergerea este ireversibilă și atrage eliminarea anunțurilor active și a istoricului de conversații. Documentele KYC vor fi reținute conform obligațiilor legale (a se vedea Politica de Confidențialitate).
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">11. Suspendarea și încetarea accesului</h2>
          <p className="mb-4">
            Ne rezervăm dreptul de a suspenda sau închide orice cont care încalcă prezentele T&C, fără preaviz și fără obligația de a oferi compensații. În cazul fraudei sau activităților ilegale, putem notifica autoritățile competente.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">12. Modificarea T&C</h2>
          <p className="mb-4">
            Domaris poate modifica prezentele T&C periodic. Modificările vor fi comunicate cu cel puțin 15 zile înainte de intrarea în vigoare prin notificare pe platformă sau prin email. Utilizarea continuă a platformei după această perioadă constituie acceptarea modificărilor.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">13. Legea aplicabilă și litigii</h2>
          <p className="mb-4">
            Prezentele T&C sunt guvernate de legislația Republicii Moldova. Orice litigiu va fi soluționat, în primă instanță, pe cale amiabilă. În lipsa unui acord, competența revine instanțelor judecătorești din Chișinău, Republica Moldova.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">14. Contact</h2>
          <p className="mb-4">
            <strong>Domaris SRL</strong><br />
            Republica Moldova<br />
            Email: <a href="mailto:legal@riva.md" className="text-primary underline">legal@riva.md</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
