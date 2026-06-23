'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { validateRequired } from '@/lib/validations';
import { showSuccess, showError, showConfirm } from '@/lib/alerts';

export default function DoctorLeavePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ from_date: '', to_date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'doctor' && parsed.role !== 'admin') {
      router.push('/login');
      return;
    }
    setUser(parsed);
    loadLeaves();
  }, [router]);

  const loadLeaves = async () => {
    try {
      const res = await api.doctorAvailability.listLeaves();
      setLeaves(res?.leaves ?? []);
    } catch (err) {
      setMessage('Failed to load leaves.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const fromErr = validateRequired(form.from_date, 'From date');
    const toErr = validateRequired(form.to_date, 'To date');
    if (fromErr || toErr) {
      const msg = (fromErr || toErr) as string;
      setMessage(msg);
      await showError('Please fill required fields', msg);
      return;
    }
    if (form.to_date < form.from_date) {
      const msg = 'To date must be on or after from date.';
      setMessage(msg);
      await showError('Invalid dates', msg);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await api.doctorAvailability.addLeave({
        from_date: form.from_date,
        to_date: form.to_date,
        reason: form.reason || undefined,
      });
      await showSuccess('Leave added successfully', 'Your leave has been recorded.');
      setForm({ from_date: '', to_date: '', reason: '' });
      setShowForm(false);
      loadLeaves();
    } catch (err) {
      setMessage('Failed to add leave.');
      await showError('Submit failed', 'Failed to add leave. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Remove leave?',
      'Are you sure you want to remove this leave?',
      'Yes',
      'No'
    );
    if (!confirmed) return;
    try {
      await api.doctorAvailability.deleteLeave(id);
      await showSuccess('Leave removed', 'The leave entry has been deleted.');
      loadLeaves();
    } catch (err) {
      setMessage('Failed to delete leave.');
      await showError('Delete failed', 'Failed to delete leave. Please try again.');
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/doctor/dashboard" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Leave</h1>
                <p className="text-xs text-gray-500">Set your availability and leave dates</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
            >
              {showForm ? 'Cancel' : 'Add Leave'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700">{message}</div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Leave</h2>
            <form onSubmit={handleAdd} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From date</label>
                <input
                  type="date"
                  value={form.from_date}
                  onChange={(e) => setForm((f) => ({ ...f, from_date: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To date</label>
                <input
                  type="date"
                  value={form.to_date}
                  onChange={(e) => setForm((f) => ({ ...f, to_date: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Vacation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Your leave entries</h2>
          </div>
          {leaves.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No leave entries. Add one above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">From</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">To</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Reason</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaves.map((l: any) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-gray-900">{l.from_date}</td>
                      <td className="py-4 px-4 text-gray-900">{l.to_date}</td>
                      <td className="py-4 px-4 text-gray-600">{l.reason || '—'}</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
