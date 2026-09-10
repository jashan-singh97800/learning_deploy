import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api/settings';
import type { Setting } from '../types';
import toast from 'react-hot-toast';
import { Settings, Percent, Save, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gstPercentage: 0,
    discountPercentage: 0,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
      setForm({
        gstPercentage: Number(data.gstPercentage),
        discountPercentage: Number(data.discountPercentage),
      });
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await updateSettings(form);
      setSettings(data);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-orange-500" />
          General Settings
        </h1>
        <p className="text-gray-500 mt-1">Configure global tax and discount rates for billing</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Percent className="w-4 h-4 text-orange-500" />
                GST Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.gstPercentage}
                  onChange={(e) => setForm({ ...form, gstPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                  placeholder="0.00"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
              <p className="text-xs text-gray-400">Default tax applied to all bills</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Percent className="w-4 h-4 text-orange-500" />
                Default Discount (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.discountPercentage}
                  onChange={(e) => setForm({ ...form, discountPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                  placeholder="0.00"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
              <p className="text-xs text-gray-400">Global discount percentage for new bills</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Last updated: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Never'}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 transition-all disabled:opacity-50 active:scale-95"
            >
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-blue-900 font-bold mb-1">Billing Integration</h3>
          <p className="text-blue-700 text-sm leading-relaxed">
            These values are applied automatically during bill creation. Changes will affect new bills but will not modify historical sales reports to maintain record integrity.
          </p>
        </div>
      </div>
    </div>
  );
}
