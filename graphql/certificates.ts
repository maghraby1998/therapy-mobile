import { gql } from "@apollo/client";

export const THERAPIST_CERTIFICATES_QUERY = gql`
  query TherapistCertificates {
    verificationDocumentTypes {
      id
      name
      description
      isRequired
      isActive
    }
    mySubmittedCertificates {
      id
      title
      issuer
      fileUrl
      notes
      documentType {
        id
        name
        description
        isRequired
        isActive
      }
    }
  }
`;

export const SUBMIT_THERAPIST_VERIFICATION_DOCUMENT_MUTATION = gql`
  mutation SubmitTherapistVerificationDocument(
    $input: SubmitTherapistVerificationDocumentInput!
  ) {
    submitTherapistVerificationDocument(input: $input) {
      id
      title
      issuer
      fileUrl
      notes
      documentType {
        id
        name
        description
        isRequired
        isActive
      }
    }
  }
`;

export type TherapistVerificationDocumentType = {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  isActive: boolean;
};

export type TherapistCertificate = {
  id: string;
  title: string;
  issuer: string;
  fileUrl: string;
  notes: string | null;
  documentType: TherapistVerificationDocumentType | null;
};

export type TherapistCertificatesQueryData = {
  verificationDocumentTypes: TherapistVerificationDocumentType[];
  mySubmittedCertificates: TherapistCertificate[];
};

export type SubmitTherapistVerificationDocumentMutationData = {
  submitTherapistVerificationDocument: TherapistCertificate;
};

export type SubmitTherapistVerificationDocumentMutationVariables = {
  input: {
    documentTypeId: string;
    file: any;
    issuer?: string | null;
    notes?: string | null;
  };
};
