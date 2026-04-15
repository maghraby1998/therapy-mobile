import { Redirect } from 'expo-router';

import { useSession } from '@/components/providers/session-provider';

export default function IndexScreen() {
  const { isAuthenticated, role } = useSession();

  if (!isAuthenticated || !role) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={role === 'doctor' ? '/(main)/(doctor)' : '/(main)/(patient)'} />;
}
