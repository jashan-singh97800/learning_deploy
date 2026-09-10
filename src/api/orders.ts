import api from './axios';
import type { FilterPeriod } from '../types';

export const createOrder = (data: any) =>
  api.post('/orders', data).then((r) => r.data);

export const getOrders = (page = 1, limit = 20) =>
  api.get('/orders', { params: { page, limit } }).then((r) => r.data);

export const getOrder = (id: string) =>
  api.get(`/orders/${id}`).then((r) => r.data);

export const getSalesReport = (filter: FilterPeriod, search?: string) =>
  api
    .get('/orders/sales', { params: { filter, search } })
    .then((r) => r.data);

export const getHeldOrders = () =>
  api.get('/orders/held').then((r) => r.data);

export const deleteOrder = (id: string) =>
  api.delete(`/orders/${id}`).then((r) => r.data);
