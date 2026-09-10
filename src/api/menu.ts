import api from './axios';
import type { MenuItem } from '../types';

export const getMenuItems = (category?: string) =>
  api.get('/menu', { params: category ? { category } : {} }).then((r) => r.data as MenuItem[]);

export const getCategories = () =>
  api.get('/menu/categories').then((r) => r.data as string[]);

export const createMenuItem = (data: Partial<MenuItem>) =>
  api.post('/menu', data).then((r) => r.data as MenuItem);

export const updateMenuItem = (id: string, data: Partial<MenuItem>) =>
  api.put(`/menu/${id}`, data).then((r) => r.data as MenuItem);

export const deleteMenuItem = (id: string) =>
  api.delete(`/menu/${id}`).then((r) => r.data);
