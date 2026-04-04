import { ApolloProvider } from '@apollo/client';
import { ReactNode } from 'react';

import { apolloClient } from '@/lib/apollo';

type AppApolloProviderProps = {
  children: ReactNode;
};

export function AppApolloProvider({ children }: AppApolloProviderProps) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
