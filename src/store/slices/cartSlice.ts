import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, MenuItem } from '../../types';

interface CartState {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  address: string;
  remark: string;
  billNo: string;
  globalDiscount: number;
  id?: string;
  status: string;
}



const initialState: CartState = {
  items: [],
  customerName: '',
  customerPhone: '',
  address: '',
  remark: '',
  billNo: `INV-${Date.now().toString().slice(-6)}`,
  globalDiscount: 0,
  status: 'completed',
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<MenuItem>) {
      const item = action.payload;
      const price = Number(item.price);
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        existing.quantity += 1;
        existing.cartTotal = existing.price * existing.quantity;
      } else {
        state.items.push({ 
          ...item, 
          price, 
          quantity: 1, 
          discount: 0, 
          cartTotal: price * 1
        });
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    increaseQty(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) {
        item.quantity += 1;
        item.cartTotal = item.price * item.quantity;
      }
    },
    decreaseQty(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) {
        if (item.quantity === 1) {
          state.items = state.items.filter((i) => i.id !== action.payload);
        } else {
          item.quantity -= 1;
          item.cartTotal = item.price * item.quantity;
        }
      }
    },
    setGlobalDiscount: (state, action: PayloadAction<number>) => {
      state.globalDiscount = action.payload;
    },
    clearCart(state) {
      state.items = [];
      state.customerName = '';
      state.customerPhone = '';
      state.address = '';
      state.remark = '';
      state.billNo = `INV-${Date.now().toString().slice(-6)}`;
      state.id = undefined;
      state.status = 'completed';
    },
    setCustomer(state, action: PayloadAction<{ name: string; phone: string; address: string; remark: string }>) {
      state.customerName = action.payload.name;
      state.customerPhone = action.payload.phone;
      state.address = action.payload.address;
      state.remark = action.payload.remark;
    },
    loadOrder(state, action: PayloadAction<any>) {
      const order = action.payload;
      state.id = order.id;
      state.customerName = order.customerName;
      state.customerPhone = order.customerPhone || '';
      state.billNo = order.orderNumber;
      state.status = order.status;
      
      const notes = (order.notes || '').split(' | ');
      state.address = notes[0] || '';
      state.remark = notes[1] || '';
      
      state.items = order.items.map((item: any) => ({
        id: item.menuItemId,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        discount: Number(item.discount || 0),
        cartTotal: Number(item.total),
      }));
    },
  },
});

export const { 
  addItem, removeItem, increaseQty, decreaseQty, 
  clearCart, setCustomer, setGlobalDiscount,
  loadOrder
} = cartSlice.actions;
export default cartSlice.reducer;
