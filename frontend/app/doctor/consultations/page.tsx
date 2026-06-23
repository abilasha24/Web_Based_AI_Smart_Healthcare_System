'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { validateRequired } from '@/lib/validations';
import { showSuccess, showError } from '@/lib/alerts';

export default function DoctorConsultationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_id: '', scheduled_at: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [consRes, patientsRes] = await Promise.all([
        api.consultations.list(),
        api.users.getPatients().catch(() => []),
      ]);
      setConsultations(consRes.consultations || []);
      setPatients(Array.isArray(patientsRes) ? patientsRes : []);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load consultations.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientErr = validateRequired(form.patient_id, 'Patient');
    const dateErr = validateRequired(form.scheduled_at, 'Date & time');
    if (patientErr || dateErr) {
      const text = (patientErr || dateErr) as string;
setMessage({ type: 'error', text });
await showError('Please fill required fields', text);
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.consultations.create({
        patient_id: form.patient_id,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        notes: form.notes || undefined,
      });
      await showSuccess('Consultation scheduled successfully', 'The appointment has been created.');
      setMessage({ type: 'success', text: 'Consultation scheduled.' });
      setForm({ patient_id: '', scheduled_at: '', notes: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to schedule consultation.' });
      await showError('Submit failed', 'Failed to schedule consultation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState({ notes: '', doctor_private_notes: '' });

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.consultations.update(id, { status });
      await showSuccess('Status updated successfully', `Consultation marked as ${status}.`);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update status.' });
      await showError('Update failed', 'Failed to update status. Please try again.');
    }
  };

  const openEditNotes = (c: any) => {
    setEditingId(c.id);
    setEditNotes({ notes: c.notes || '', doctor_private_notes: c.doctor_private_notes || '' });
  };

  const handleSaveNotes = async () => {
    if (!editingId) return;
    try {
      await api.consultations.update(editingId, {
        notes: editNotes.notes,
        doctor_private_notes: editNotes.doctor_private_notes,
      });
      await showSuccess('Notes saved successfully', 'Consultation notes have been updated.');
      setEditingId(null);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save notes.' });
      await showError('Save failed', 'Failed to save notes. Please try again.');
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
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
                <h1 className="text-xl font-bold text-gray-900">Consultations</h1>
                <p className="text-xs text-gray-500">Schedule and manage patient consultations</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
            >
              {showForm ? 'Cancel' : 'Schedule New Consultation'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {message.text && (
          <div className={`p-4 rounded-lg ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message.text}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Schedule Consultation</h2>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                >
                  <option value="">Select patient</option>
                  {patients.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Schedule'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Your Consultations</h2>
          </div>
          {consultations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No consultations yet. Schedule one using the button above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Patient</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Scheduled</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {consultations.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{c.patient_name || c.patient_id}</td>
                      <td className="py-4 px-4 text-gray-600">
                        {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          c.status === 'completed' ? 'bg-green-100 text-green-800' :
                          c.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 space-x-2">
                        <button
                          onClick={() => openEditNotes(c)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Edit notes
                        </button>
                        {c.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(c.id, 'completed')}
                              className="text-green-600 hover:underline text-sm"
                            >
                              Mark completed
                            </button>
                            <button
                              onClick={() => handleStatusChange(c.id, 'cancelled')}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {editingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Consultation notes (private notes only you see)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (visible to patient)</label>
                  <textarea
                    value={editNotes.notes}
                    onChange={(e) => setEditNotes((n) => ({ ...n, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Private notes (doctor/admin only)</label>
                  <textarea
                    value={editNotes.doctor_private_notes}
                    onChange={(e) => setEditNotes((n) => ({ ...n, doctor_private_notes: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSaveNotes}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
