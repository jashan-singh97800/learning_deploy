import axios from './axios';

export const getUsers = async () => {
  const { data } = await axios.get('/users');
  return data;
};

export const createUser = async (userData: any) => {
  const { data } = await axios.post('/users', userData);
  return data;
};

export const updateUser = async (id: string, userData: any) => {
  const { data } = await axios.put(`/users/${id}`, userData);
  return data;
};

export const deleteUser = async (id: string) => {
  const { data } = await axios.delete(`/users/${id}`);
  return data;
};
