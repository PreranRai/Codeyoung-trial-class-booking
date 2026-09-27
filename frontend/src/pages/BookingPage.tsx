import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DateTime } from 'luxon';
import {
  Calendar as CalendarIcon,
  Clock,
  Globe,
  User,
  Mail,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { fetchSlots, createBooking, Slot, fetchTimezones } from '../api/client';

const parentFormSchema = z.object({
  parentName: z.string().min(2, 'Name must be at least 2 characters'),
  parentEmail: z.string().email('Please enter a valid email address'),
  timezone: z.string().min(1, 'Please select a timezone'),
});

type ParentFormData = z.infer<typeof parentFormSchema>;

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();

  // Detect local browser timezone
  const detectedTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';

  const [step, setStep] = useState<1 | 2>(1);
  const [timezones, setTimezones] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd')
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ParentFormData>({
    resolver: zodResolver(parentFormSchema),
    defaultValues: {
      parentName: '',
      parentEmail: '',
      timezone: detectedTimezone,
    },
  });

  const currentTimezone = watch('timezone');

  useEffect(() => {
    fetchTimezones()
      .then((tzList) => setTimezones(tzList))
      .catch((err) => console.error('Failed to load timezones:', err));
  }, []);

  // Fetch slots whenever step 2 date or timezone changes
  useEffect(() => {
    if (step === 2 && selectedDate && currentTimezone) {
      setLoadingSlots(true);
      setBookingError(null);
      fetchSlots(selectedDate, currentTimezone)
        .then((fetchedSlots) => {
          setSlots(fetchedSlots);
          setSelectedSlot(null);
        })
        .catch((err) => {
          setBookingError(err.message || 'Failed to load available slots.');
        })
        .finally(() => {
          setLoadingSlots(false);
        });
    }
  }, [step, selectedDate, currentTimezone]);

  const onProceedToSlots = () => {
    setBookingError(null);
    setStep(2);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const parentName = watch('parentName');
      const parentEmail = watch('parentEmail');
      const timezone = watch('timezone');

      const response = await createBooking({
        parentName,
        parentEmail,
        timezone,
        startTimeUtc: selectedSlot.startTimeUtc,
      });

      // Navigate to confirmation page
      navigate(`/confirmation/${response.bookingId}`, { state: { booking: response } });
    } catch (err: any) {
      if (err.code === 'SLOT_UNAVAILABLE') {
        setBookingError('That slot is no longer available! Another parent just reserved it. Please choose another available slot.');
        // Refresh slots
        fetchSlots(selectedDate, currentTimezone).then(setSlots);
      } else {
        setBookingError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeDateByDays = (days: number) => {
    const current = DateTime.fromISO(selectedDate);
    const next = current.plus({ days });
    setSelectedDate(next.toFormat('yyyy-MM-dd'));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 mb-3">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-sky-600" /> Free 60-Minute Trial Class
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Book a Trial Class for Your Child
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto">
          Experience 1-on-1 live coding and math classes with expert tutors tailored to your local schedule.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 space-x-4">
        <div
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            step === 1 ? 'bg-sky-600 text-white shadow' : 'bg-slate-200 text-slate-700'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white text-sky-700 flex items-center justify-center text-xs font-bold">
            1
          </span>
          <span>Parent Details</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-300" />
        <div
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            step === 2 ? 'bg-sky-600 text-white shadow' : 'bg-slate-200 text-slate-700'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white text-sky-700 flex items-center justify-center text-xs font-bold">
            2
          </span>
          <span>Select Date & Time</span>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
        {step === 1 && (
          <form onSubmit={handleSubmit(onProceedToSlots)} className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
              Step 1: Enter Your Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Parent Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    {...register('parentName')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-900"
                  />
                </div>
                {errors.parentName && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{errors.parentName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    {...register('parentEmail')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-900"
                  />
                </div>
                {errors.parentEmail && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{errors.parentEmail.message}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Your Timezone
                </label>
                <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded font-medium">
                  Auto-detected: {detectedTimezone}
                </span>
              </div>
              <div className="relative">
                <Globe className="w-5 h-5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  {...register('timezone')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white text-slate-900"
                >
                  {timezones.length > 0 ? (
                    timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label} ({tz.value})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="America/New_York">Eastern Time (America/New_York)</option>
                      <option value="America/Chicago">Central Time (America/Chicago)</option>
                      <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
                      <option value="Europe/London">London / GMT / BST (Europe/London)</option>
                      <option value="Asia/Kolkata">India Standard Time (Asia/Kolkata)</option>
                    </>
                  )}
                </select>
              </div>
              {errors.timezone && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.timezone.message}</p>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <span>Select Trial Time Slot</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Step 2: Choose Date & Local Time Slot
                </h2>
                <p className="text-xs text-slate-500 mt-1 flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-1 text-sky-600" />
                  Showing slots for timezone: <strong className="ml-1 text-slate-700">{currentTimezone}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-sky-600 hover:text-sky-800 underline self-start sm:self-auto"
              >
                ← Edit Parent Info & Timezone
              </button>
            </div>

            {/* Date Selector bar */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-5 h-5 text-sky-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={DateTime.now().toFormat('yyyy-MM-dd')}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-slate-800 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-sm font-semibold text-slate-600 hidden sm:inline">
                  {DateTime.fromISO(selectedDate).toFormat('EEEE, MMMM d')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => changeDateByDays(1)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-700"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Box */}
            {bookingError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start space-x-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{bookingError}</p>
                </div>
              </div>
            )}

            {/* Slots Grid */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-sky-600" /> Available Time Slots
                </h3>
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                  Times shown in your local timezone ({currentTimezone})
                </span>
              </div>

              {loadingSlots ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium">Checking tutor availability for {selectedDate}...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="py-10 px-6 text-center bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <p className="font-bold text-lg mb-1">Looks like we're fully booked for this day.</p>
                  <p className="text-sm text-amber-800 mb-4">
                    All mentors are occupied or outside working hours for this local date. Please try another day.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={() => changeDateByDays(1)}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      Check Next Day ({DateTime.fromISO(selectedDate).plus({ days: 1 }).toFormat('MMM d')})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.startTimeUtc === slot.startTimeUtc;
                    return (
                      <button
                        key={slot.startTimeUtc}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          !slot.available
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-sky-600 border-sky-600 text-white shadow-md ring-2 ring-sky-300'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-sky-400 hover:bg-sky-50'
                        }`}
                      >
                        <div className="font-bold text-base">
                          {slot.parentLocalStart}
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${
                            isSelected ? 'text-sky-100' : 'text-slate-500'
                          }`}
                        >
                          {slot.timezoneAbbr} ({CONFIG_SLOT_DURATION} mins)
                        </div>

                        {!slot.available && (
                          <span className="block text-[10px] font-semibold text-rose-500 mt-1">
                            Fully Booked
                          </span>
                        )}
                        {slot.available && (
                          <span
                            className={`block text-[10px] font-semibold mt-1 ${
                              isSelected ? 'text-sky-200' : 'text-emerald-600'
                            }`}
                          >
                            {slot.availableMentorCount} tutor{slot.availableMentorCount > 1 ? 's' : ''} available
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirmation Footer */}
            {selectedSlot && (
              <div className="mt-8 p-4 bg-sky-50 border border-sky-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-sky-800 uppercase tracking-wider font-bold">Selected Trial Slot</p>
                  <p className="text-base font-extrabold text-sky-950">
                    {selectedSlot.parentLocalDateFormatted} at {selectedSlot.parentLocalStart} ({selectedSlot.timezoneAbbr})
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                  className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Confirm Trial Booking</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CONFIG_SLOT_DURATION = 60;
