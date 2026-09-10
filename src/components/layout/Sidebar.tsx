import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import type { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { logoutApi } from '../../api/auth';
import { getRestaurant } from '../../api/settings';
import type { RestaurantDetail } from '../../types';
import {
  ChefHat,
  ReceiptText,
  UtensilsCrossed,
  BarChart3,
  LogOut,
  User,
  Settings,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/billing', icon: ReceiptText, label: 'Billing', roles: ['admin', 'staff'] },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu', roles: ['admin', 'staff'] },
  { to: '/sales', icon: BarChart3, label: 'Sales', roles: ['admin'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
  { to: '/users', icon: Users, label: 'Staff Management', roles: ['admin'] },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);

  useEffect(() => {
    getRestaurant().then(setRestaurant).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.warn('Backend logout failed', e);
    }
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none truncate">{restaurant?.name || 'RestoBill'}</h1>
            <p className="text-gray-400 text-xs mt-0.5">Restaurant System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems
          .filter((item) => user?.role && item.roles.includes(user.role))
          .map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
