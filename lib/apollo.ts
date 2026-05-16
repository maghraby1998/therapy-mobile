import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const GRAPHQL_API_URL = "https://5d0b-197-55-51-237.ngrok-free.app/graphql";

let accessToken: string | null = null;

export function setApolloAccessToken(token: string | null) {
  accessToken = token;
}

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  };
});

const httpLink = new HttpLink({
  uri: GRAPHQL_API_URL,
});

const link = ApolloLink.from([authLink, httpLink]);

export const apolloClient: ApolloClient<NormalizedCacheObject> =
  new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

export { GRAPHQL_API_URL };
