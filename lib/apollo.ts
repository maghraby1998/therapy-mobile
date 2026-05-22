import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { setContext } from "@apollo/client/link/context";

const GRAPHQL_API_URL = "https://51b9-41-239-30-50.ngrok-free.app/graphql";

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

const httpLink = createUploadLink({
  uri: GRAPHQL_API_URL,
  headers: {
    "apollo-require-preflight": "true",
  }
});

const link = ApolloLink.from([authLink, httpLink]);

export const apolloClient: ApolloClient<NormalizedCacheObject> =
  new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

export { GRAPHQL_API_URL };
