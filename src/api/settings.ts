import api from './axios';
import type { Setting, RestaurantDetail } from '../types';

export const getSettings = async (): Promise<Setting> => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (data: { gstPercentage: number; discountPercentage: number }): Promise<Setting> => {
  const response = await api.put('/settings', data);
  return response.data;
};

export const getRestaurant = async (): Promise<RestaurantDetail> => {
  const response = await api.get('/settings/restaurant');
  return response.data;
};

export const updateRestaurant = async (data: Partial<RestaurantDetail>): Promise<RestaurantDetail> => {
  const response = await api.put('/settings/restaurant', data);
  return response.data;
};
