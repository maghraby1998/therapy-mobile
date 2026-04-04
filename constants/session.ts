export type UserRole = 'patient' | 'doctor';

export const isAuth = false;
export const userRole: UserRole = 'patient';

export const currentUser = {
  id: 'user-preview-id',
  email: 'demo@therapy.app',
};

export const authOperations = {
  register: `mutation Register($input: RegisterInput!) {
  register(input: $input) {
    accessToken
    tokenType
    user {
      id
      email
    }
  }
}`,
  login: `mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    tokenType
    user {
      id
      email
    }
  }
}`,
};
