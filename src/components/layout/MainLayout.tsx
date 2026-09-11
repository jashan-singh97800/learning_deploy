import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 text-white flex items-center px-4 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="ml-3 font-bold text-sm">RestoBill</span>
      </div>

      <main className="flex-1 lg:ml-64 min-h-screen overflow-auto pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
