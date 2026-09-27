import React, { useEffect, useState } from 'react';
import { fetchAdminOverview, AdminOverviewResponse } from '../api/client';
import { Users, Calendar, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    fetchAdminOverview()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-600" /> Admin & Debug Dashboard
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Mentor Workload & Booking Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time capacity tracking across mentor-local calendar days. Max limit = 2 bookings/day per mentor.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading && !data ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-medium text-sm">Loading admin metrics...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900">
          <p className="font-bold">Error loading overview:</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Today's Total Bookings
                </span>
                <Calendar className="w-5 h-5 text-sky-600" />
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{data.totalBookingsToday}</p>
              <p className="text-xs text-slate-500 mt-1">Capacity: Up to 20 bookings/day (10 mentors × 2)</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active Mentors
                </span>
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{data.mentorStats.length}</p>
              <p className="text-xs text-slate-500 mt-1">Default timezone: Asia/Kolkata (IST)</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Full Capacity Mentors
                </span>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">
                {data.mentorStats.filter((m) => m.status === 'Full').length} / {data.mentorStats.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Mentors reaching 2/2 daily limit</p>
            </div>
          </div>

          {/* Mentors Capacity Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Mentor Availability & Workload</h2>
              <span className="text-xs text-slate-500">Max limit = 2 demo classes/day</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-6">Mentor Name</th>
                    <th className="py-3 px-6">Timezone</th>
                    <th className="py-3 px-6">Bookings Today</th>
                    <th className="py-3 px-6">Remaining Capacity</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {data.mentorStats.map((mentor) => (
                    <tr key={mentor.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {mentor.name}
                        <span className="block text-xs font-normal text-slate-400">{mentor.email}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-xs">{mentor.timezone}</td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {mentor.bookingsToday} / {mentor.dailyLimit}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {mentor.remainingCapacity} slots remaining
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            mentor.status === 'Full'
                              ? 'bg-rose-100 text-rose-800'
                              : mentor.status === 'Available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {mentor.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Bookings List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Bookings Log</h2>
            {data.recentBookings.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No bookings recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {data.recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{b.parentName}</span>
                        <span className="text-xs text-slate-500">({b.parentEmail})</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>Parent Local Time:</strong> {b.parentLocalTime} ({b.parentTimezone})
                      </p>
                    </div>

                    <div className="text-right sm:text-left md:text-right">
                      <p className="text-xs text-slate-600">
                        Assigned Mentor: <strong className="text-slate-900">{b.mentorName}</strong>
                      </p>
                      <p className="text-xs text-purple-700 mt-0.5">
                        Mentor Local Time: {b.mentorLocalTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
