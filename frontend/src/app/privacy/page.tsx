"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Politica de Confidențialitate</h1>
        </div>

        <div className="prose prose-sm max-w-none rounded-2xl border border-border bg-card p-8 text-foreground">
          <p className="text-sm text-muted-foreground mb-6">
            Ultima actualizare: 25 iunie 2026
          </p>

          <p className="mb-6">
            RIVA (denumită în continuare <strong>„Platforma"</strong> sau <strong>„noi"</strong>) este un marketplace imobiliar peer-to-peer operat de Domaris SRL, înregistrată în Republica Moldova. Prezenta Politică de Confidențialitate descrie modul în care colectăm, prelucrăm și protejăm datele dumneavoastră cu caracter personal, în conformitate cu Legea nr. 133/2011 privind protecția datelor cu caracter personal a Republicii Moldova și, în măsura aplicabilității, cu Regulamentul (UE) 2016/679 (GDPR).
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">1. Operatorul de date</h2>
          <p className="mb-4">
            Operator al datelor cu caracter personal este <strong>Domaris SRL</strong>, cu sediul în Republica Moldova.<br />
            Contact: <a href="mailto:privacy@riva.md" className="text-primary underline">privacy@riva.md</a>
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">2. Categoriile de date colectate</h2>
          <p className="mb-2">Colectăm următoarele categorii de date cu caracter personal:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li><strong>Date de identificare:</strong> nume, prenume, adresă de email, număr de telefon.</li>
            <li><strong>Date de cont:</strong> parolă (stocată criptat cu bcrypt), fotografie de profil (opțional), biografie (opțional).</li>
            <li><strong>Date KYC (Know Your Customer):</strong> copie act de identitate sau documente de proprietate, colectate exclusiv pentru verificarea identității proprietarilor care doresc badge-ul „Proprietate verificată". Aceste date sunt prelucrate cu consimțământul explicit al utilizatorului.</li>
            <li><strong>Date de anunț:</strong> titlu, descriere, fotografii, locație (adresă, coordonate GPS), preț.</li>
            <li><strong>Date de comunicare:</strong> mesajele schimbate prin sistemul intern de chat.</li>
            <li><strong>Date de utilizare:</strong> adresă IP, tip browser, paginile vizitate, data și ora accesului.</li>
            <li><strong>Date tehnice:</strong> token-uri de autentificare (stocate local în browser).</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">3. Scopurile și temeiul juridic al prelucrării</h2>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold">Scop</th>
                  <th className="text-left py-2 font-semibold">Temei juridic</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4">Crearea și administrarea contului</td>
                  <td className="py-2">Executarea contractului (art. 6(1)(b) GDPR)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4">Publicarea și gestionarea anunțurilor imobiliare</td>
                  <td className="py-2">Executarea contractului</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4">Comunicarea între utilizatori (mesagerie internă)</td>
                  <td className="py-2">Executarea contractului</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4">Verificarea identității (KYC) și a documentelor de proprietate</td>
                  <td className="py-2">Consimțământ explicit (art. 6(1)(a) GDPR)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4">Trimiterea de notificări și alerte</td>
                  <td className="py-2">Consimțământ / interes legitim</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4">Securitatea platformei și prevenirea fraudei</td>
                  <td className="py-2">Interes legitim (art. 6(1)(f) GDPR)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Respectarea obligațiilor legale</td>
                  <td className="py-2">Obligație legală (art. 6(1)(c) GDPR)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">4. Durata păstrării datelor</h2>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Datele de cont sunt păstrate pe durata activității contului și până la 2 ani după ștergerea acestuia, cu excepția cazurilor în care legea impune o perioadă mai lungă.</li>
            <li>Documentele KYC sunt stocate pe durata obligațiilor legale aplicabile (minim 5 ani, conform legislației anti-spălare a banilor din Republica Moldova).</li>
            <li>Mesajele sunt păstrate 12 luni de la ultima interacțiune.</li>
            <li>Datele de utilizare (log-uri) sunt păstrate maximum 90 de zile.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">5. Destinatarii datelor</h2>
          <p className="mb-4">
            Nu vindem și nu divulgăm datele dumneavoastră cu caracter personal unor terți în scopuri de marketing. Putem partaja datele cu:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li><strong>Furnizori de infrastructură:</strong> servicii de hosting cloud (servere situate în UE/SEE).</li>
            <li><strong>Furnizori de servicii de email</strong> pentru trimiterea notificărilor tranzacționale.</li>
            <li><strong>Autorități competente</strong> în cazul în care legea o impune (instanțe, poliție, organe de anchetă).</li>
          </ul>
          <p className="mb-4">
            Orice transfer de date în afara Republicii Moldova se efectuează cu respectarea garanțiilor adecvate (clauze contractuale standard sau decizii de adecvare ale Comisiei Europene).
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">6. Cookie-uri</h2>
          <p className="mb-4">
            Platforma folosește cookie-uri și tehnologii similare pentru:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li><strong>Cookie-uri esențiale:</strong> necesare pentru funcționarea platformei (autentificare, sesiune). Nu pot fi dezactivate.</li>
            <li><strong>Cookie-uri analitice:</strong> pentru înțelegerea modului de utilizare a platformei (date anonimizate). Sunt activate numai cu consimțământul dumneavoastră.</li>
          </ul>
          <p className="mb-4">
            Puteți gestiona preferințele privind cookie-urile din setările browser-ului dumneavoastră.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">7. Drepturile dumneavoastră</h2>
          <p className="mb-2">În conformitate cu legislația aplicabilă, aveți dreptul la:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li><strong>Acces:</strong> să solicitați o copie a datelor personale pe care le deținem despre dumneavoastră.</li>
            <li><strong>Rectificare:</strong> să corectați datele inexacte sau incomplete direct din secțiunea Setări.</li>
            <li><strong>Ștergere ("dreptul de a fi uitat"):</strong> să solicitați ștergerea datelor, cu excepția cazurilor în care prelucrarea este obligatorie prin lege. Puteți șterge contul direct din <strong>Setări → Securitate → Șterge cont</strong>.</li>
            <li><strong>Restricționare:</strong> să solicitați limitarea prelucrării datelor dumneavoastră.</li>
            <li><strong>Portabilitate:</strong> să primiți datele dumneavoastră într-un format structurat, lizibil automat.</li>
            <li><strong>Opoziție:</strong> să vă opuneți prelucrării bazate pe interesul nostru legitim.</li>
            <li><strong>Retragerea consimțământului:</strong> oricând, fără a afecta legalitatea prelucrării anterioare.</li>
          </ul>
          <p className="mb-4">
            Pentru exercitarea acestor drepturi, contactați-ne la: <a href="mailto:privacy@riva.md" className="text-primary underline">privacy@riva.md</a>. Răspundem în termen de 30 de zile.
          </p>
          <p className="mb-4">
            Aveți de asemenea dreptul de a depune o plângere la <strong>Centrul Național pentru Protecția Datelor cu Caracter Personal al Republicii Moldova</strong> (www.datepersonale.md).
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">8. Securitatea datelor</h2>
          <p className="mb-4">
            Aplicăm măsuri tehnice și organizatorice adecvate pentru protecția datelor: criptarea parolelor (bcrypt), transmiterea datelor prin HTTPS/TLS, controlul accesului la sistemele interne, monitorizarea securității. În caz de incident de securitate care vă afectează, vă vom notifica în termenele prevăzute de lege.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">9. Minori</h2>
          <p className="mb-4">
            Platforma RIVA nu este destinată persoanelor sub 18 ani. Nu colectăm intenționat date cu caracter personal ale minorilor. Dacă aflați că un minor ne-a furnizat date fără consimțământul unui tutore, vă rugăm să ne contactați.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">10. Modificări ale politicii</h2>
          <p className="mb-4">
            Putem actualiza periodic această politică. Modificările semnificative vor fi comunicate prin email sau prin notificare în platformă. Continuarea utilizării platformei după intrarea în vigoare a modificărilor constituie acceptarea acestora.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">11. Contact</h2>
          <p className="mb-4">
            Pentru orice întrebări sau solicitări privind datele personale:<br />
            <strong>Domaris SRL</strong><br />
            Email: <a href="mailto:privacy@riva.md" className="text-primary underline">privacy@riva.md</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
