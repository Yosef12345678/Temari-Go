export { useColorScheme } from 'react-native';

import { useColorScheme as useRNColorScheme } from 'react-native';

/** Resolves `unspecified` / `null` system values to a concrete theme key. */
export function useResolvedColorScheme(): 'light' | 'dark' {
  const scheme = useRNColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
