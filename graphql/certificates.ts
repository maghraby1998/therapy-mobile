import { gql } from "@apollo/client";

export const DOCTOR_CERTIFICATES_QUERY = gql`
  query DoctorCertificates {
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

export const SUBMIT_DOCTOR_VERIFICATION_DOCUMENT_MUTATION = gql`
  mutation SubmitDoctorVerificationDocument(
    $input: SubmitDoctorVerificationDocumentInput!
  ) {
    submitDoctorVerificationDocument(input: $input) {
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

export type DoctorVerificationDocumentType = {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  isActive: boolean;
};

export type DoctorCertificate = {
  id: string;
  title: string;
  issuer: string;
  fileUrl: string;
  notes: string | null;
  documentType: DoctorVerificationDocumentType | null;
};

export type DoctorCertificatesQueryData = {
  verificationDocumentTypes: DoctorVerificationDocumentType[];
  mySubmittedCertificates: DoctorCertificate[];
};

export type SubmitDoctorVerificationDocumentMutationData = {
  submitDoctorVerificationDocument: DoctorCertificate;
};

export type SubmitDoctorVerificationDocumentMutationVariables = {
  input: {
    documentTypeId: string;
    file: any;
    issuer?: string | null;
    notes?: string | null;
  };
};
