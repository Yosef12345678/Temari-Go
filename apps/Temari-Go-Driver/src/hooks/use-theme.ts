import { usePreferences } from '@/state/preferences-context';

export function useTheme() {
  return usePreferences().theme;
}
