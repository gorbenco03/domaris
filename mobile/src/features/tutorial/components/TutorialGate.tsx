/**
 * IMOBI - Tutorial Gate
 * Controls tutorial prompt and overlay presentation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { TutorialOverlay } from './TutorialOverlay';
import { TutorialPromptModal } from './TutorialPromptModal';
import { useTutorial } from '../hooks/useTutorial';

export const TutorialGate: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { shouldShowPrompt, startTutorial, dismissPrompt } = useTutorial();

  const wasAuthenticated = useRef(isAuthenticated);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);

  useEffect(() => {
    if (!wasAuthenticated.current && isAuthenticated && shouldShowPrompt) {
      const timer = setTimeout(() => {
        setShowTutorialPrompt(true);
      }, 800);
      return () => clearTimeout(timer);
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, shouldShowPrompt]);

  const handleAcceptTutorial = () => {
    setShowTutorialPrompt(false);
    setTimeout(() => {
      startTutorial();
    }, 300);
  };

  const handleDeclineTutorial = () => {
    setShowTutorialPrompt(false);
    dismissPrompt();
  };

  return (
    <>
      <TutorialPromptModal
        visible={showTutorialPrompt}
        onAccept={handleAcceptTutorial}
        onDecline={handleDeclineTutorial}
      />
      <TutorialOverlay />
    </>
  );
};

export default TutorialGate;
