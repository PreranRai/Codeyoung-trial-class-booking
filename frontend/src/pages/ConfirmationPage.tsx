import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Video, User, Mail, Globe, ArrowRight } from 'lucide-react';
import { fetchBooking, BookingResponse } from '../api/client';

export const ConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [booking, setBooking] = useState<BookingResponse | null>(
    (location.state as any)?.booking || null
  );
  const [loading, setLoading] = useState<boolean>(!booking);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!booking && id) {
      setLoading(true);
      fetchBooking(id)
        .then(setBooking)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, booking]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Loading your booking confirmation...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900">
          <p className="font-bold text-lg mb-2">Booking Not Found</p>
          <p className="text-sm text-rose-700 mb-4">{error || 'Could not find the requested booking details.'}</p>
          <Link
            to="/"
            className="inline-block bg-sky-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-sky-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold">Trial Class Booked!</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Booking ID: <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-xs">{booking.bookingId}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-sky-600" />
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Confirmation Sent To</p>
                <p className="text-sm font-bold text-slate-900">{booking.parent.email}</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              Confirmed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parent Local Time Box */}
            <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
              <div className="flex items-center space-x-2 text-sky-800 font-bold text-sm">
                <Globe className="w-4 h-4 text-sky-600" />
                <span>Your Local Schedule ({booking.parent.timezone})</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Date & Local Time</p>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{booking.parentLocalTime}</p>
              </div>
            </div>

            {/* Mentor Local Time Box */}
            <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div className="flex items-center space-x-2 text-purple-800 font-bold text-sm">
                <User className="w-4 h-4 text-purple-600" />
                <span>Assigned Expert Mentor</span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">{booking.mentor.name}</p>
                <p className="text-xs text-slate-500 mt-1">Mentor local time ({booking.mentor.timezone}):</p>
                <p className="text-sm font-semibold text-purple-950 mt-0.5">{booking.mentorLocalTime}</p>
              </div>
            </div>
          </div>

          {/* Join Link Callout */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-sky-500/20 rounded-xl border border-sky-400/30">
                  <Video className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Interactive Demo Class</h3>
                  <p className="text-xs text-slate-300">Join 5 minutes prior to start time</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={booking.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>Join Demo Class Now</span>
                <ArrowRight className="w-5 h-5" />
              </a>

              <Link
                to="/"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center text-sm"
              >
                Book Another Class
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
