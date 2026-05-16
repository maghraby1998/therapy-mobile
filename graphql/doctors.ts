import { gql } from '@apollo/client';

export const DOCTORS_QUERY = gql`
  query Doctors {
    doctors {
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

export type Doctor = {
  id: string;
  fullName?: string | null;
  specialty?: string | null;
  bio?: string | null;
};

export type DoctorsQueryData = {
  doctors: Doctor[];
};

export type BookSessionMutationData = {
  bookSession: {
    id: string;
  };
};

export type BookSessionMutationVariables = {
  input: {
    doctorId: string;
    startsAt: string;
    endsAt: string;
    notes?: string | null;
  };
};
