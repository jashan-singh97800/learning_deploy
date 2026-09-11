import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  addItem, removeItem, increaseQty, decreaseQty,
  clearCart, setCustomer, setGlobalDiscount, loadOrder
} from '../store/slices/cartSlice';
import { getMenuItems } from '../api/menu';
import { createOrder } from '../api/orders';
import { getSettings, getRestaurant } from '../api/settings';
import type { MenuItem, Setting, Order, RestaurantDetail } from '../types';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Plus, Minus, Trash2, Search,
  UtensilsCrossed, User, Phone, Receipt, Printer,
  CheckCircle, X, MapPin, MessageSquare, Hash,
  Calendar, Tag, PauseCircle, ListRestart, ArrowUpRight, ArrowLeft, RefreshCw
} from 'lucide-react';
import { getHeldOrders, deleteOrder } from '../api/orders';

const CATEGORY_ICONS: Record<string, string> = {
  All: '🍽️', Pizza: '🍕', Burgers: '🍔', Pasta: '🍝',
  Salads: '🥗', Starters: '🧆', Beverages: '🥤', Desserts: '🍰',
  'Main Course': '🍛', Other: '🍱',
};

const RS = '₹';

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numberToWords(n: number): string {
  const num = Math.floor(n);
  if (num === 0) return 'Zero';
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  return convert(num);
}

export default function BillingPage() {
  const dispatch = useDispatch();
  const cart = useSelector((s: RootState) => s.cart);
 useSelector((s: RootState) => s.auth.user);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showBillModal, setShowBillModal] = useState(false);
  const [savedOrder, setSavedOrder] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<Setting | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  
  const [customGst, setCustomGst] = useState<number | null>(null);
  const [customDiscount, setCustomDiscount] = useState<number | null>(null);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [heldOrders, setHeldOrders] = useState<Order[]>([]);
  const [loadingHeld, setLoadingHeld] = useState(false);
  const [mobileView, setMobileView] = useState<'menu' | 'cart'>('menu');

  const [custName, setCustName] = useState(cart.customerName);
  const [custPhone, setCustPhone] = useState(cart.customerPhone);
  const [custAddress, setCustAddress] = useState(cart.address);
  const [custRemark, setCustRemark] = useState(cart.remark);

  const syncCustomer = (field: string, value: string) => {
    const next = {
      name: field === 'name' ? value : custName,
      phone: field === 'phone' ? value : custPhone,
      address: field === 'address' ? value : custAddress,
      remark: field === 'remark' ? value : custRemark,
    };
    if (field === 'name') setCustName(value);
    if (field === 'phone') setCustPhone(value);
    if (field === 'address') setCustAddress(value);
    if (field === 'remark') setCustRemark(value);
    dispatch(setCustomer(next));
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    syncCustomer('phone', digits);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMenuItems();
        setItems(data);
        const cats = ['All', ...Array.from(new Set(data.map((i) => i.category))).sort()];
        setCategories(cats);
        
        const [settings, resto] = await Promise.all([getSettings(), getRestaurant()]);
        setGlobalSettings(settings);
        setRestaurant(resto);
        setCustomDiscount(Number(settings.discountPercentage));
        dispatch(setGlobalDiscount(Number(settings.discountPercentage)));
      } catch {
        toast.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = items.filter((item) => {
    if (!item.isAvailable) return false;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const valueOfGoods = cart.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const billDiscount = customDiscount !== null ? (valueOfGoods) * (customDiscount / 100) : 0;
  const afterDiscount = valueOfGoods - billDiscount;
  const gstRate = customGst !== null ? customGst / 100 : (globalSettings ? Number(globalSettings.gstPercentage) / 100 : 0.05);
  const gst = afterDiscount * gstRate;
  const invoiceValue = afterDiscount + gst;
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleClear = () => {
    dispatch(clearCart());
    setCustName(''); setCustPhone(''); setCustAddress(''); setCustRemark('');
    setCustomGst(null); setCustomDiscount(null);
  };

  const handleHoldOrder = async () => {
    if (!custName.trim()) { toast.error('Please enter customer name'); return; }
    if (cart.items.length === 0) { toast.error('Cart is empty'); return; }
    setSubmitting(true);
    try {
      await createOrder({
        id: cart.id,
        customerName: custName,
        customerPhone: custPhone || undefined,
        notes: [custAddress, custRemark].filter(Boolean).join(' | ') || undefined,
        items: cart.items.map((i) => ({
          menuItemId: i.id,
          name: i.name,
          price: Number(i.price),
          quantity: i.quantity,
          discount: i.discount,
          total: Number(i.cartTotal),
        })),
        subtotal: parseFloat(afterDiscount.toFixed(2)),
        tax: parseFloat(gst.toFixed(2)),
        discount: customDiscount || 0,
        total: parseFloat(invoiceValue.toFixed(2)),
        status: 'hold',
      });
      handleClear();
      toast.success('Bill kept on hold');
    } catch {
      toast.error('Failed to hold bill');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHeldOrders = async () => {
    setLoadingHeld(true);
    try {
      const data = await getHeldOrders();
      setHeldOrders(data);
    } catch {
      toast.error('Failed to load held bills');
    } finally {
      setLoadingHeld(false);
    }
  };

  const handleDeleteOrder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteOrder(id);
      setHeldOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success('Bill deleted');
    } catch {
      toast.error('Failed to delete bill');
    }
  };

  const resumeOrder = (order: Order) => {
    dispatch(loadOrder(order));
    setCustName(order.customerName);
    setCustPhone(order.customerPhone || '');
    const notes = (order.notes || '').split(' | ');
    setCustAddress(notes[0] || '');
    setCustRemark(notes[1] || '');
    setCustomDiscount(Number(order.discount) || null);
    setShowHeldModal(false);
    toast.success('Bill resumed');
  };

  const handlePlaceOrder = async () => {
    if (!custName.trim()) { toast.error('Please enter customer name'); return; }
    if (cart.items.length === 0) { toast.error('Cart is empty'); return; }
    setSubmitting(true);
    try {
      const order = await createOrder({
        id: cart.id,
        customerName: custName,
        customerPhone: custPhone || undefined,
        notes: [custAddress, custRemark].filter(Boolean).join(' | ') || undefined,
        items: cart.items.map((i) => ({
          menuItemId: i.id,
          name: i.name,
          price: Number(i.price),
          quantity: i.quantity,
          discount: i.discount,
          total: Number(i.cartTotal),
        })),
        subtotal: parseFloat(afterDiscount.toFixed(2)),
        tax: parseFloat(gst.toFixed(2)),
        discount: customDiscount || 0,
        total: parseFloat(invoiceValue.toFixed(2)),
        status: 'completed',
      });
      setSavedOrder(order);
      setShowBillModal(true);
      dispatch(clearCart());
      setCustName(''); setCustPhone(''); setCustAddress(''); setCustRemark('');
      toast.success('Order saved!');
    } catch {
      toast.error('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* ── LEFT: Menu Selector ── */}
      <div className={`${mobileView === 'cart' ? 'hidden' : 'flex'} lg:flex flex-1 flex-col overflow-hidden min-w-0 w-full pb-16 lg:pb-0`}>
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50"
            />
          </div>
          <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{CATEGORY_ICONS[cat] || '🍱'}</span>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-44 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((item) => {
                const inCart = cart.items.find((i) => i.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => dispatch(addItem(item))}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition text-left group relative"
                  >
                    {inCart && (
                      <div className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                        {inCart.quantity}
                      </div>
                    )}
                    <div className="h-28 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <span className="text-4xl">{CATEGORY_ICONS[item.category] || '🍱'}</span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="font-semibold text-gray-800 text-xs truncate">{item.name}</p>
                      <p className="text-orange-600 font-bold text-sm mt-0.5">{RS}{Number(item.price).toFixed(2)}</p>
                      <div className="mt-1.5 flex items-center justify-center gap-1 bg-orange-500 text-white rounded-lg py-1 opacity-0 group-hover:opacity-100 transition text-xs font-medium">
                        <Plus className="w-3 h-3" /> Add
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Billing Panel ── */}
      <div className={`${mobileView === 'menu' ? 'hidden' : 'flex'} lg:flex w-full lg:w-[480px] flex-shrink-0 bg-white border-l-0 lg:border-l border-gray-200 flex-col shadow-xl overflow-hidden`}>

        {/* Bill Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileView('menu')}
                aria-label="Back to menu"
                className="lg:hidden -ml-1 p-1 rounded hover:bg-white/20 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Receipt className="w-4 h-4" />
              <span className="font-bold text-sm tracking-wide uppercase">Sale Entry</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium opacity-90">
              <button 
                onClick={() => { setShowHeldModal(true); fetchHeldOrders(); }}
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition border border-white/20"
              >
                <ListRestart className="w-3.5 h-3.5" />
                Held Bills
              </button>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{dateStr}</span>
            </div>
          </div>
        </div>

        {/* Bill Info Fields */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <Hash className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 leading-none">Bill No.</p>
                <p className="text-sm font-bold text-gray-800 font-mono">{cart.billNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 leading-none">Items</p>
                <p className="text-sm font-bold text-gray-800">{itemCount} qty / {cart.items.length} types</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={custName}
                onChange={(e) => syncCustomer('name', e.target.value)}
                placeholder="Customer name *"
                className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="tel"
                value={custPhone}
                onChange={handlePhoneInput}
                placeholder="Mobile (10 digits)"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={custAddress}
                onChange={(e) => syncCustomer('address', e.target.value)}
                placeholder="Address"
                className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              />
            </div>
            <div className="relative">
              <MessageSquare className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={custRemark}
                onChange={(e) => syncCustomer('remark', e.target.value)}
                placeholder="Remark"
                className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-shrink-0 bg-gray-800 text-white grid text-xs font-semibold uppercase tracking-wide"
            style={{ gridTemplateColumns: '1fr 60px 70px 72px 36px' }}>
            <div className="px-3 py-2">Product</div>
            <div className="px-1 py-2 text-center">Qty</div>
            <div className="px-1 py-2 text-right">M.R.P.</div>
            <div className="px-1 py-2 text-right">Amount</div>
            <div className="px-1 py-2"></div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 py-10">
                <ShoppingCart className="w-14 h-14 mb-3" />
                <p className="font-medium text-gray-400 text-sm">No items added</p>
                <p className="text-xs text-gray-300 mt-1">Click menu items to add</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cart.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`grid items-center text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-orange-50/40'}`}
                    style={{ gridTemplateColumns: '1fr 60px 70px 72px 36px' }}
                  >
                    <div className="px-3 py-2">
                      <p className="font-medium text-gray-800 text-xs leading-tight truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Tag className="w-2.5 h-2.5" />{item.category}
                      </p>
                    </div>
                    <div className="px-1 py-2 flex items-center justify-center gap-0.5">
                      <button onClick={() => dispatch(decreaseQty(item.id))}
                        className="w-5 h-5 bg-red-50 text-red-500 rounded flex items-center justify-center hover:bg-red-100 transition flex-shrink-0">
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                      <button onClick={() => dispatch(increaseQty(item.id))}
                        className="w-5 h-5 bg-green-50 text-green-600 rounded flex items-center justify-center hover:bg-green-100 transition flex-shrink-0">
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <div className="px-1 py-2 text-right">
                      <span className="text-xs font-medium text-gray-700">{RS}{Number(item.price).toFixed(2)}</span>
                    </div>
                    <div className="px-1 py-2 text-right">
                      <span className="text-xs font-bold text-orange-600">{RS}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="px-1 py-2 flex items-center justify-center">
                      <button onClick={() => dispatch(removeItem(item.id))}
                        className="w-5 h-5 text-gray-300 hover:text-red-500 transition flex items-center justify-center">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="flex-shrink-0 border-t-2 border-gray-200 bg-gray-50">
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span className="font-medium">GST</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" step="0.01"
                  value={customGst ?? (globalSettings?.gstPercentage || 5)}
                  onChange={(e) => setCustomGst(parseFloat(e.target.value))}
                  className="w-12 text-center text-[10px] border border-gray-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-orange-300 bg-white"
                />
                <span className="w-16 text-right font-semibold text-gray-800">{RS}{gst.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span className="font-medium">Extra Bill Discount (%)</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" step="0.1"
                  value={customDiscount ?? 0}
                  onChange={(e) => setCustomDiscount(parseFloat(e.target.value))}
                  className="w-12 text-center text-[10px] border border-gray-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-orange-300 bg-white"
                />
                <span className="w-16 text-right font-semibold text-red-500">- {RS}{billDiscount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-300">
              <span className="uppercase tracking-wide">Invoice Value</span>
              <span className="text-xl text-orange-600">{RS}{invoiceValue.toFixed(2)}</span>
            </div>
          </div>
          <div className="px-4 pb-4 flex gap-2">
            <button onClick={handleClear}
              className="flex-1 py-2.5 border border-gray-300 text-gray-500 rounded-xl text-xs font-semibold hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition flex items-center justify-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
            <button
              onClick={handleHoldOrder}
              disabled={submitting || cart.items.length === 0}
              className="flex-1 py-2.5 bg-slate-700 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1.5 shadow-md shadow-slate-200">
              <PauseCircle className="w-4 h-4" /> Hold
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={submitting || cart.items.length === 0}
              className="flex-[2] py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold hover:from-orange-600 hover:to-amber-600 transition shadow-md shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" />
              {submitting ? 'Saving...' : 'Print Bill'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav: switch between Menu and Billing */}
      {mobileView === 'menu' && (
        <button
          onClick={() => setMobileView('cart')}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl px-4 py-3 flex items-center justify-between font-semibold"
        >
          <span className="flex items-center gap-2 text-sm">
            <ShoppingCart className="w-4 h-4" />
            {cart.items.reduce((n, i) => n + i.quantity, 0)} items
          </span>
          <span className="text-sm">
            {cart.items.length > 0 ? `View Bill · ${RS}${invoiceValue.toFixed(2)}` : 'View Bill'}
          </span>
        </button>
      )}

      {/* Held Bills Modal */}
      {showHeldModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListRestart className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold text-gray-800">Held Bills</h2>
              </div>
              <button onClick={() => setShowHeldModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {loadingHeld ? (
                <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-orange-500" /></div>
              ) : heldOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <PauseCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No bills currently on hold</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {heldOrders.map((order) => (
                    <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-orange-200 hover:bg-orange-50/30 transition group">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-bold text-gray-800">{order.orderNumber}</span>
                          <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase">Hold</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">{order.customerName}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{order.items.length} items • {new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-400 leading-none mb-1">Total</p>
                          <p className="font-bold text-orange-600">{RS}{order.total}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => handleDeleteOrder(order.id, e)}
                            className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg transition-colors border border-gray-100 hover:border-red-100"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => resumeOrder(order)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition shadow-lg shadow-orange-100 active:scale-95"
                          >
                            Resume <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Print Bill Modal ── */}
      {showBillModal && savedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-auto max-h-[90vh] relative">

            {/* Close button — hidden on print */}
            <button
              onClick={() => setShowBillModal(false)}
              className="no-print absolute top-3 right-3 z-10 w-8 h-8 bg-gray-100 hover:bg-red-100 hover:text-red-500 rounded-full flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ── Thermal Receipt ── */}
            <div className="p-5 font-mono text-xs text-gray-900" style={{ fontFamily: "'Courier New', Courier, monospace" }}>

              {/* Restaurant Header */}
              <div className="text-center mb-3">
                <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-0.5">Bill of Supply</p>
                <h2 className="text-xl font-black uppercase tracking-wide leading-tight">
                  {restaurant?.name || 'RestoBill'}
                </h2>
                {restaurant?.address && (
                  <p className="text-[11px] font-semibold mt-0.5 uppercase">{restaurant.address}</p>
                )}
                {restaurant?.phone && (
                  <p className="text-[11px] mt-0.5">Phone : {restaurant.phone}</p>
                )}
                {restaurant?.gstin && (
                  <p className="text-[11px] mt-0.5">GSTIN : {restaurant.gstin}</p>
                )}
              </div>

              <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2 grid grid-cols-2 gap-x-2 text-[11px]">
                <div>
                  <p><span className="font-bold">Customer:</span> {savedOrder.customerName}</p>
                  <p><span className="font-bold">Mobile :</span> {savedOrder.customerPhone || ''}</p>
                </div>
                <div className="text-right">
                  <p><span className="font-bold">Bill No.</span> {savedOrder.orderNumber}</p>
                  <p><span className="font-bold">Date :</span> {new Date(savedOrder.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-[11px] mb-1">
                <thead>
                  <tr className="border-b border-dashed border-gray-400">
                    <th className="text-left pb-1 w-5">S.</th>
                    <th className="text-left pb-1">Description</th>
                    <th className="text-center pb-1 w-8">Qty</th>
                    <th className="text-right pb-1 w-16">Rate</th>
                    <th className="text-right pb-1 w-16">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {savedOrder.items.map((item: any, idx: number) => (
                    <tr key={item.id} className="border-b border-dotted border-gray-200">
                      <td className="py-0.5 align-top">{idx + 1}</td>
                      <td className="py-0.5 font-semibold uppercase">{item.name}</td>
                      <td className="py-0.5 text-center">{item.quantity}</td>
                      <td className="py-0.5 text-right">{Number(item.price).toFixed(2)}</td>
                      <td className="py-0.5 text-right font-bold">{Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-[11px] mb-2">
                Item Qty: {savedOrder.items.reduce((s: number, i: any) => s + i.quantity, 0)}
              </p>

              {/* Totals */}
              <div className="border-t border-dashed border-gray-400 pt-2 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Value of Goods</span>
                  <span>{Number(savedOrder.subtotal).toFixed(2)}</span>
                </div>
                {Number(savedOrder.discount) > 0 && (
                  <div className="flex justify-between">
                    <span>Discount ({savedOrder.discount}%)</span>
                    <span>- {(Number(savedOrder.subtotal) * Number(savedOrder.discount) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST ({globalSettings?.gstPercentage || 5}%)</span>
                  <span>{Number(savedOrder.tax).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-gray-400 my-1 py-1 flex justify-between text-sm font-black uppercase">
                <span>G.Total :-</span>
                <span>{Number(savedOrder.total).toFixed(2)}</span>
              </div>

              <p className="text-[11px] mt-1 border-b border-dashed border-gray-400 pb-2">
                Rs. {numberToWords(Number(savedOrder.total))} Only
              </p>

              <div className="flex justify-between text-[11px] mt-2">
                <span>E.&amp;O.E</span>
                <span>For &quot;{restaurant?.name || 'RestoBill'}&quot;</span>
              </div>
            </div>

            {/* Actions — hidden on print */}
            <div className="no-print px-5 pb-5 flex gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => setShowBillModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-500" /> Done
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-medium text-sm hover:bg-orange-600 transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
