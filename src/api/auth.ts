import api from './axios';

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const logoutApi = () => api.post('/auth/logout').then((r) => r.data);

export const getProfile = () => api.get('/auth/profile').then((r) => r.data);
