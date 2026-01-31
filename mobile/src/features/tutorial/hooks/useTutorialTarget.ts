/**
 * RIVA - useTutorialTarget Hook
 * Registers a component as a tutorial target
 */

import { useEffect, RefObject } from 'react';
import { View } from 'react-native';
import { useTutorialContext } from '../contexts/TutorialContext';

/**
 * Hook to register a component as a tutorial spotlight target
 *
 * @param key - Unique identifier for this target (matches TutorialStep.targetKey)
 * @param ref - React ref to the View component to highlight
 *
 * @example
 * ```tsx
 * const searchBarRef = useRef<View>(null);
 * useTutorialTarget('home-search-bar', searchBarRef);
 *
 * return (
 *   <View ref={searchBarRef}>
 *     <SearchBar />
 *   </View>
 * );
 * ```
 */
export const useTutorialTarget = (
  key: string,
  ref: RefObject<View | null>
): void => {
  const { registerTarget, unregisterTarget } = useTutorialContext();

  useEffect(() => {
    registerTarget(key, ref);

    return () => {
      unregisterTarget(key);
    };
  }, [key, ref, registerTarget, unregisterTarget]);
};

export default useTutorialTarget;
