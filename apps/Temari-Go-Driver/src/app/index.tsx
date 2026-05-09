import { Redirect } from 'expo-router';

import { useSession } from '@/state/session-context';

export default function IndexRoute() {
  const { status, bootstrapComplete } = useSession();

  if (!bootstrapComplete || status === 'unknown') return null;
  if (status === 'authenticated') return <Redirect href="/(app)/route" />;
  return <Redirect href="/(auth)/login" />;
}
