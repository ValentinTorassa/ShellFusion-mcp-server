import api from './api';
import { jwtDecode } from 'jwt-decode';

interface SignupResponse {
  success: boolean;
  message: string;
  result: {
    email: string;
    _id: string;
  };
}

interface SigninResponse {
  success: boolean;
  token: string;
  message: string;
}

interface DecodedToken {
  userId: string;
  email: string;
}

export const signup = async (credentials: { email: string; password: string }): Promise<SignupResponse> => {
  const response = await api.post<SignupResponse>('/api/auth/signup', credentials);
  return response.data;
};

export const signin = async (credentials: { email: string; password: string }): Promise<SigninResponse & { email: string; userId: string }> => {
  const response = await api.post<SigninResponse>('/api/auth/signin', credentials);
  const decoded = jwtDecode<DecodedToken>(response.data.token);
  return {
    ...response.data,
    email: decoded.email,
    userId: decoded.userId,
  };
};

export const signout = async (): Promise<void> => {
  await api.post('/api/auth/signout');
};

