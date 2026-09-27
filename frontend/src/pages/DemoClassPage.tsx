import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Video, Clock, User, Globe, CheckCircle2 } from 'lucide-react';
import { fetchBooking, BookingResponse } from '../api/client';

export const DemoClassPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBooking(id)
        .then(setBooking)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-slate-950 text-white rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Virtual Room Header */}
        <div className="p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-lg text-slate-100">Codeyoung Virtual Classroom</span>
          </div>
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold px-3 py-1 rounded-full text-xs flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Your Trial Class is Scheduled
          </span>
        </div>

        {/* Video Placeholder Box */}
        <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-20 h-20 bg-sky-500/10 border border-sky-500/20 rounded-3xl flex items-center justify-center text-sky-400 mb-4 shadow-inner">
            <Video className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">Interactive Demo Class</h1>
          <p className="text-slate-400 text-sm max-w-md">
            This live classroom portal will activate when your scheduled session begins.
          </p>

          <div className="mt-6 inline-flex items-center space-x-2 bg-slate-800/80 px-4 py-2 rounded-xl text-xs text-slate-300 font-mono">
            <span>Booking ID:</span>
            <strong className="text-sky-400">{id}</strong>
          </div>
        </div>

        {/* Details Footer */}
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading session details...</div>
        ) : error || !booking ? (
          <div className="p-6 text-center text-slate-400">
            Session information available upon start time.
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-purple-400" /> Assigned Tutor
              </span>
              <p className="text-base font-bold text-white">{booking.mentor.name}</p>
              <p className="text-xs text-slate-400">({booking.mentor.timezone})</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-sky-400" /> Parent Local Time
              </span>
              <p className="text-sm font-semibold text-white">{booking.parentLocalTime}</p>
              <p className="text-xs text-slate-400">({booking.parent.timezone})</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 flex items-center">
                <Globe className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Mentor Local Time
              </span>
              <p className="text-sm font-semibold text-white">{booking.mentorLocalTime}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="text-sm font-semibold text-sky-600 hover:text-sky-700">
          ← Back to Main Booking Portal
        </Link>
      </div>
    </div>
  );
};
