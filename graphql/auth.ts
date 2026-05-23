import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      tokenType
      user {
        id
        email
        role
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      tokenType
      user {
        id
        email
        role
      }
    }
  }
`;

export type UserRole = "CLIENT" | "THERAPIST";

export type AuthUser = {
  id: string;
  email: string;
  role?: UserRole | null;
};

export type AuthPayload = {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
};

export type LoginMutationData = {
  login: AuthPayload;
};

export type LoginMutationVariables = {
  input: {
    emailOrPhone: string;
    password: string;
  };
};

export type RegisterMutationData = {
  register: AuthPayload;
};

export type RegisterMutationVariables = {
  input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    nickname?: string | null;
    isAnonymous?: boolean | null;
  };
};
