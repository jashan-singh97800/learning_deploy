export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  description?: string;
  isAvailable: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  discount: number;
  cartTotal: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  staff?: User;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  filter: string;
  startDate: string;
  endDate: string;
}

export type FilterPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Setting {
  id: string;
  gstPercentage: number;
  discountPercentage: number;
  updatedAt: string;
}

export interface RestaurantDetail {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  gstin?: string;
  email?: string;
  tagline?: string;
  updatedAt: string;
}
