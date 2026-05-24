import { usePreferences } from '@/src/state/preferences-context';

export function useTheme() {
  return usePreferences().theme;
}
