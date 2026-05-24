export { useColorScheme } from 'react-native';

import { usePreferences } from '@/src/state/preferences-context';

/** Resolves theme preference (including manual override) to a concrete theme key. */
export function useResolvedColorScheme(): 'light' | 'dark' {
  const { resolvedTheme } = usePreferences();
  return resolvedTheme;
}
