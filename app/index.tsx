import { Redirect } from 'expo-router';

import { isAuth, userRole } from '@/constants/session';

export default function IndexScreen() {
  if (!isAuth) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={userRole === 'doctor' ? '/(main)/(doctor)' : '/(main)/(patient)'} />;
}
