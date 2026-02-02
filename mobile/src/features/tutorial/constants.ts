/**
 * RIVA - Tutorial Constants
 */

import { TutorialStep } from './types';

// ============================================
// STORAGE KEYS
// ============================================

export const TUTORIAL_STORAGE_KEYS = {
  PROMPT_SEEN: 'tutorial_prompt_seen',
  COMPLETED: 'tutorial_completed',
} as const;

// ============================================
// TUTORIAL STEPS
// ============================================

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'categories',
    targetKey: 'home-categories',
    title: 'Categorii',
    description: 'Filtrează rapid după tipul proprietății: apartamente, case sau spații comerciale.',
    tooltipPosition: 'bottom',
    highlightPadding: 8,
    highlightBorderRadius: 16,
  },
  {
    id: 'home-notifications',
    targetKey: 'home-notifications',
    title: 'Notificări',
    description: 'Aici vezi rapid noutăți: cereri de vizionare, mesaje și alerte importante.',
    tooltipPosition: 'bottom',
    highlightPadding: 10,
    highlightBorderRadius: 24,
  },
  {
    id: 'ai-chat',
    targetKey: 'home-ai-banner',
    title: 'Asistent AI',
    description: 'Descrie în cuvinte proprii ce cauți și AI-ul nostru îți va găsi proprietatea potrivită.',
    tooltipPosition: 'top',
    highlightPadding: 8,
    highlightBorderRadius: 20,
  },
  {
    id: 'tab-home',
    targetKey: 'tab-home',
    title: 'Acasă',
    description: 'Revii rapid la pagina principală cu sugestii și categorii.',
    tooltipPosition: 'top',
    highlightPadding: 12,
    highlightBorderRadius: 24,
  },
  {
    id: 'tab-search',
    targetKey: 'tab-search',
    title: 'Caută',
    description: 'Folosește filtrele ca să găsești proprietatea perfectă mai rapid.',
    tooltipPosition: 'top',
    highlightPadding: 12,
    highlightBorderRadius: 24,
  },
  {
    id: 'favorites',
    targetKey: 'tab-favorites',
    title: 'Favorite',
    description: 'Salvează proprietățile care îți plac și compară-le mai târziu.',
    tooltipPosition: 'top',
    highlightPadding: 12,
    highlightBorderRadius: 24,
  },
  {
    id: 'messages',
    targetKey: 'tab-messages',
    title: 'Mesaje',
    description: 'Comunică direct cu proprietarii, fără intermediari.',
    tooltipPosition: 'top',
    highlightPadding: 12,
    highlightBorderRadius: 24,
  },
  {
    id: 'profile',
    targetKey: 'tab-profile',
    title: 'Profilul Tău',
    description: 'Gestionează contul, proprietățile publicate și setările aplicației.',
    tooltipPosition: 'top',
    highlightPadding: 12,
    highlightBorderRadius: 24,
  },
];

// ============================================
// ANIMATION CONFIG
// ============================================

export const TUTORIAL_ANIMATION = {
  OVERLAY_FADE_DURATION: 300,
  SPOTLIGHT_MOVE_DURATION: 250,
  TOOLTIP_FADE_DURATION: 250,
} as const;

// ============================================
// OVERLAY CONFIG
// ============================================

export const TUTORIAL_OVERLAY = {
  BACKDROP_OPACITY: 0.6,
  SPOTLIGHT_PADDING: 8,
} as const;
