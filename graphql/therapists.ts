import { gql } from '@apollo/client';

export const THERAPISTS_QUERY = gql`
  query Therapists {
    therapists {
      id
      fullName
      specialty
      bio
    }
  }
`;

export const BOOK_SESSION_MUTATION = gql`
  mutation BookSession($input: BookSessionInput!) {
    bookSession(input: $input) {
      id
    }
  }
`;

export type Therapist = {
  id: string;
  fullName?: string | null;
  specialty?: string | null;
  bio?: string | null;
};

export type TherapistsQueryData = {
  therapists: Therapist[];
};

export type BookSessionMutationData = {
  bookSession: {
    id: string;
  };
};

export type BookSessionMutationVariables = {
  input: {
    therapistId: string;
    startsAt: string;
    endsAt: string;
    notes?: string | null;
  };
};
