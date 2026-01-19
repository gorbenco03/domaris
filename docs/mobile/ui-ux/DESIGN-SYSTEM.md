# 🎨 IMOBI Design System

**Versiune:** 1.0.0  
**Data:** Ianuarie 2026  
**Concept:** Premium Minimalism  
**Motto:** "Încredere prin Simplitate"

---

## 📋 Cuprins

1. [Filozofia de Design](#filozofia-de-design)
2. [Paleta de Culori](#paleta-de-culori)
3. [Tipografie](#tipografie)
4. [Spațiere și Grid](#spațiere-și-grid)
5. [Componente UI](#componente-ui)
6. [Iconografie](#iconografie)
7. [Ilustrații și Imagini](#ilustrații-și-imagini)
8. [Animații și Micro-interacțiuni](#animații-și-micro-interacțiuni)
9. [Dark Mode](#dark-mode)
10. [Accesibilitate](#accesibilitate)

---

## 🧠 Filozofia de Design

### Principii Fundamentale

| Principiu               | Descriere                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Încredere (Trust)**   | Utilizatorii fac tranzacții de sute de mii de euro. Designul trebuie să inspire siguranță și profesionalism. |
| **Claritate (Clarity)** | Informația corectă în momentul potrivit. Fără zgomot vizual.                                                 |
| **Eficiență (Speed)**   | Orice acțiune trebuie să fie la maxim 3 tap-uri distanță.                                                    |
| **Plăcere (Delight)**   | Micro-animații care fac experiența memorabilă.                                                               |

### Ce NU suntem

- ❌ **Copilăros:** Fără culori neon, fără emoji-uri excesive, fără animații exagerate
- ❌ **Outdated:** Fără umbre dure, fără gradiente stridente, fără texturi din anii 2000
- ❌ **Generic:** Nu arătăm ca toate celelalte aplicații imobiliare

### Ce suntem

- ✅ **Premium:** Ca un showroom de mașini de lux - curat, spațios, rafinat
- ✅ **Modern:** Inspirat de Airbnb, Revolut, Apple - lideri în UX
- ✅ **Încrezător:** Design care spune "aici ești pe mâini bune"

---

## 🎨 Paleta de Culori

### Culori Primare

```css
/* Primary Brand Colors */
--color-primary: #1e3a5f; /* Deep Navy - Autoritate & Încredere */
--color-primary-light: #2d5a87; /* Hover state */
--color-primary-dark: #0f1d2f; /* Active state */

--color-accent: #10b981; /* Emerald - Succes & Acțiune */
--color-accent-light: #34d399; /* Hover */
--color-accent-dark: #059669; /* Active */
```

### Culori Secundare

```css
/* Secondary Colors */
--color-secondary: #6366f1; /* Indigo - AI & Interactiv */
--color-warning: #f59e0b; /* Amber - Atenție & Premium Badge */
--color-error: #ef4444; /* Red - Erori */
--color-info: #3b82f6; /* Blue - Informații */
```

### Culori Neutre

```css
/* Neutrals - Light Mode */
--color-background: #f8fafc; /* Fundal principal - NOT pure white */
--color-surface: #ffffff; /* Carduri, modals */
--color-surface-elevated: #ffffff;

--color-text-primary: #0f172a; /* Titluri, text principal */
--color-text-secondary: #64748b; /* Text secundar, hints */
--color-text-tertiary: #94a3b8; /* Placeholder, disabled */

--color-border: #e2e8f0; /* Borduri subtile */
--color-divider: #f1f5f9; /* Separatoare */
```

### Gradiente

```css
/* Premium Gradients - folosiți cu moderație */
--gradient-primary: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
--gradient-accent: linear-gradient(135deg, #10b981 0%, #059669 100%);
--gradient-ai: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #10b981 100%);
--gradient-gold: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
```

---

## ✍️ Tipografie

### Font Family

**Primary Font:** `Inter` (Google Fonts)

- Clean, modern, excelent pe ecrane
- Suport complet pentru limba română

**Fallback:** `SF Pro Display` (iOS), `Roboto` (Android), `system-ui`

### Scala Tipografică

```css
/* Type Scale - Mobile First */
--text-xs: 12px; /* Captions, labels mici */
--text-sm: 14px; /* Text secundar */
--text-base: 16px; /* Body text - BASE */
--text-lg: 18px; /* Body emphasized */
--text-xl: 20px; /* Subtitluri */
--text-2xl: 24px; /* Titluri secțiuni */
--text-3xl: 30px; /* Titluri ecrane */
--text-4xl: 36px; /* Hero text */
--text-5xl: 48px; /* Display - folosit rar */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Utilizare

| Element        | Size | Weight   | Color          |
| -------------- | ---- | -------- | -------------- |
| **Heading 1**  | 30px | Semibold | text-primary   |
| **Heading 2**  | 24px | Semibold | text-primary   |
| **Heading 3**  | 20px | Medium   | text-primary   |
| **Body**       | 16px | Regular  | text-primary   |
| **Body Small** | 14px | Regular  | text-secondary |
| **Caption**    | 12px | Regular  | text-tertiary  |
| **Button**     | 16px | Semibold | -              |
| **Label**      | 12px | Medium   | text-secondary |
| **Price**      | 24px | Bold     | accent         |

---

## 📐 Spațiere și Grid

### Spacing Scale (8pt Grid)

```css
--space-0: 0px;
--space-1: 4px; /* Minimal - între iconițe și text */
--space-2: 8px; /* Tight - padding intern mic */
--space-3: 12px; /* Small */
--space-4: 16px; /* Base - padding standard */
--space-5: 20px; /* Medium */
--space-6: 24px; /* Large */
--space-8: 32px; /* XLarge - între secțiuni */
--space-10: 40px; /* XXLarge */
--space-12: 48px; /* Mega - header height */
--space-16: 64px; /* Ultra */
--space-20: 80px; /* Hero sections */
```

### Border Radius

```css
--radius-none: 0px;
--radius-sm: 4px; /* Tags, badges mici */
--radius-md: 8px; /* Inputs, butoane mici */
--radius-lg: 12px; /* Butoane principale */
--radius-xl: 16px; /* Carduri */
--radius-2xl: 20px; /* Carduri mari, bottom sheets */
--radius-3xl: 24px; /* Modals */
--radius-full: 9999px; /* Pills, avatare */
```

### Shadows (Soft Diffusion Style)

```css
/* Shadows - Light Mode */
--shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
--shadow-md: 0 4px 6px rgba(15, 23, 42, 0.04), 0 2px 4px rgba(15, 23, 42, 0.02);
--shadow-lg:
  0 10px 15px rgba(15, 23, 42, 0.04), 0 4px 6px rgba(15, 23, 42, 0.02);
--shadow-xl:
  0 20px 25px rgba(15, 23, 42, 0.06), 0 8px 10px rgba(15, 23, 42, 0.03);

/* Elevation for Cards */
--shadow-card:
  0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03);

/* Glow for Focus States */
--shadow-focus: 0 0 0 3px rgba(99, 102, 241, 0.2);
--shadow-accent: 0 0 0 3px rgba(16, 185, 129, 0.2);
```

---

## 🧱 Componente UI

### Butoane

#### Primary Button

```
┌─────────────────────────────────┐
│     Publică anunțul     →      │  ← Emerald (#10B981)
└─────────────────────────────────┘   Text: White, Semibold
                                      Radius: 12px
                                      Height: 52px
                                      Shadow: shadow-md
```

#### Secondary Button

```
┌─────────────────────────────────┐
│        Salvează draft           │  ← Border: Primary
└─────────────────────────────────┘   Background: Transparent
                                      Text: Primary, Semibold
```

#### AI Button (Special)

```
┌─────────────────────────────────┐
│   🤖  Întreabă AI              │  ← Gradient AI
└─────────────────────────────────┘   Animație shimmer subtilă
```

### Carduri

#### Property Card (Lista)

```
┌─────────────────────────────────────┐
│                                     │
│     [    IMAGINE    ]               │  ← 16:10 aspect ratio
│     [   60% card    ]               │
│                                     │
│  ┌──────────────┐                   │  ← Glassmorphism badge
│  │  95.000 €    │                   │     peste imagine
│  └──────────────┘                   │
├─────────────────────────────────────┤
│  Apartament 3 camere                │  ← Heading 3
│  📍 Drumul Taberei, București       │  ← Text secondary + icon
│                                     │
│  🛏 3  ·  🛁 2  ·  📐 75 m²         │  ← Caracteristici cu iconițe
│                                     │
│  ♡ 12 salvări  ·  👁 234 vizualizări│  ← Stats mici, text tertiary
└─────────────────────────────────────┘
   Radius: 16px
   Shadow: shadow-card
   Background: surface
```

### Inputs

```
┌─────────────────────────────────────┐
│  Locație                            │  ← Label: 12px, text-secondary
│  ┌─────────────────────────────────┐│
│  │ 🔍  București, Sector 6        ││  ← Icon + Placeholder/Value
│  └─────────────────────────────────┘│     Border: border color
│                                     │     Radius: 12px
│                                     │     Height: 52px
└─────────────────────────────────────┘

Focus state: border-color -> accent, shadow-focus
Error state: border-color -> error, red glow
```

### Bottom Navigation

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   🏠      🔍      💬       ♡       👤          │
│  Acasă  Caută   Mesaje  Favorite  Profil       │
│                                                 │
│   ●                                            │  ← Indicator activ
└─────────────────────────────────────────────────┘
   Background: surface
   Shadow: shadow-lg (inversed - sus)
   Height: 56px + safe area
   Icons: 24px, animație scale la tap
```

---

## 🎯 Iconografie

### Stil

- **Tip:** Line icons (outlined), 1.5px stroke
- **Dimensiuni:** 20px (small), 24px (medium), 32px (large)
- **Set recomandat:** Lucide Icons sau Phosphor Icons

### Iconițe Custom Brand

| Icon          | Utilizare                          |
| ------------- | ---------------------------------- |
| 🏠 Home       | Navigare, proprietăți              |
| 🔍 Search     | Căutare                            |
| ♡ Heart       | Favorite (outline), Saved (filled) |
| 💬 Chat       | Mesaje - cu badge pentru unread    |
| 📍 Location   | Locație, hartă                     |
| 🤖 AI Sparkle | Funcții AI                         |
| ✓ Check       | Verificat, Success                 |
| ⭐ Star       | Rating, Premium                    |

---

## 🖼️ Ilustrații și Imagini

### Fotografii Proprietăți

- **Aspect Ratio:** 16:10 pentru liste, 4:3 pentru galerie full
- **Placeholder:** Shimmer loading effect (nu spinner)
- **Error State:** Ilustrație minimalistă de casă cu "Imaginea nu a putut fi încărcată"

### Empty States

Nu afișăm doar text! Folosim ilustrații minimaliste line-art:

```
        ___
       /   \
      |  ?  |     Nicio proprietate găsită
       \___/
                  Încearcă să modifici filtrele
                  sau [Întreabă AI-ul nostru]
```

### Avatare

- **Forma:** Cerc (radius-full)
- **Dimensiuni:** 32px (mic), 48px (mediu), 80px (mare)
- **Fallback:** Inițiale pe fundal gradient

---

## ✨ Animații și Micro-interacțiuni

### Principii

- **Durată:** 200-300ms pentru majoritatea, 400-500ms pentru tranziții complexe
- **Easing:** `ease-out` pentru intrări, `ease-in` pentru ieșiri
- **Subtilitate:** Animațiile trebuie să fie "felt, not seen"

### Animații Standard

| Acțiune               | Animație                                 |
| --------------------- | ---------------------------------------- |
| **Tap pe Card**       | Scale 0.98 → 1.0 + shadow change         |
| **Favorite Toggle**   | Heart scale bounce 1.0 → 1.3 → 1.0       |
| **Like/Save**         | Confetti micro-burst (3-5 particule)     |
| **Pull to Refresh**   | Custom spinner (logo animat)             |
| **Screen Transition** | Shared element transition pentru imagini |
| **Loading**           | Skeleton shimmer (gradient animat)       |
| **AI Typing**         | Pulsing dots cu gradient AI              |
| **Success**           | Checkmark draw animation                 |

### Haptic Feedback (Mobile)

| Acțiune             | Haptic               |
| ------------------- | -------------------- |
| Tap pe buton        | Light impact         |
| Salvare la favorite | Medium impact        |
| Eroare              | Notification (error) |
| Succes (publicare)  | Success pattern      |

---

## 🌙 Dark Mode

### Paleta Dark

```css
/* Dark Mode Colors */
--color-background-dark: #0f172a; /* Deep navy, NOT pure black */
--color-surface-dark: #1e293b; /* Carduri */
--color-surface-elevated-dark: #334155;

--color-text-primary-dark: #f8fafc;
--color-text-secondary-dark: #94a3b8;
--color-text-tertiary-dark: #64748b;

--color-border-dark: #334155;
--color-divider-dark: #1e293b;
```

### Reguli Dark Mode

1. **Accent-urile rămân la fel** - Emerald, Indigo, Gold își păstrează valorile
2. **Umbre devin glow-uri** - În loc de umbre, folosim border-uri subtile sau glow-uri
3. **Imagini** - Ușor dim (90% opacity) pentru a nu fi orbitoare
4. **Toggle automat** - Urmăm preferința de sistem by default

---

## ♿ Accesibilitate

### Contrast

- Text pe fundal: Minim **4.5:1** ratio
- Text mare pe fundal: Minim **3:1** ratio
- Toate culorile noastre trec testele WCAG AA

### Touch Targets

- **Minimum:** 44x44 px pentru orice element interactiv
- **Recomandat:** 48x48 px

### Screen Readers

- Toate imaginile au `alt` text descriptiv
- Butoanele au labels clare
- Ierarhia heading-urilor este respectată (H1 → H2 → H3)

---

## 📦 Tokens Export (pentru dezvoltare)

Toate valorile de mai sus vor fi exportate ca:

- **React Native:** `theme.ts` cu TypeScript types
- **CSS Variables:** Pentru web components
- **Figma Tokens:** Pentru design handoff

---

## 🎯 Quick Reference Card

| Element       | Valoare        | Utilizare        |
| ------------- | -------------- | ---------------- |
| Primary Color | `#1E3A5F`      | Autoritate       |
| Accent Color  | `#10B981`      | CTA, Success     |
| AI Color      | `#6366F1`      | AI Features      |
| Premium Color | `#F59E0B`      | Badges           |
| Font          | Inter          | Tot              |
| Base Radius   | 12-16px        | Carduri, Butoane |
| Base Spacing  | 16px           | Padding standard |
| Animation     | 250ms ease-out | Tranziții        |

---

**Creat cu ❤️ pentru IMOBI**  
_Design System v1.0 - Ianuarie 2026_
