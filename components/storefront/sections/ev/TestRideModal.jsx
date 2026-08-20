'use client';

import { useState } from 'react';
import { X, Calendar, MapPin, Zap, CheckCircle2, User, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Interactive Test Ride Modal for EV Bikes Storefront.
 * Allows visitors to request a free test ride for Vlektra, Metro EV, or Ramza models.
 */
export function TestRideModal({ isOpen, onClose, storeName = 'Tenvo EV', vehicle = null }) {
  const [modelOverride, setModelOverride] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lahore');
  const [date, setDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const model = modelOverride || vehicle?.name || 'Metro T9 Sport (Smart Scooter)';

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('Please enter your name and contact phone number');
      return;
    }
    setSubmitted(true);
    toast.success('Test ride request submitted successfully! Our showroom advisor will contact you.', { duration: 4000 });
  };

  const handleReset = () => {
    setSubmitted(false);
    setModelOverride('');
    setName('');
    setPhone('');
    setDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        {/* Accent Header */}
        <div className="relative p-6 bg-slate-50 border-b border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/80 text-slate-600 hover:bg-slate-300 hover:text-slate-900 transition"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200 mb-2">
            <Zap className="h-3.5 w-3.5 fill-red-600" />
            Free Showroom Experience
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Book Your Free Test Ride
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Experience instant electric torque and zero noise at {storeName}.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200">
              <CheckCircle2 className="h-10 w-10 text-red-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Test Ride Scheduled!</h4>
            <p className="text-sm text-slate-600 font-medium">
              Thank you <span className="font-bold text-slate-900">{name}</span>. Your test ride for{' '}
              <span className="font-bold text-red-600">{model}</span> has been logged.
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Our EV specialist will call you at <span className="font-mono text-slate-900">{phone}</span> to confirm your slot in {city}.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="w-full mt-4 rounded-2xl bg-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-md hover:bg-red-700 transition"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select EV Model
              </label>
              <select
                value={model}
                onChange={(e) => setModelOverride(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none"
              >
                <option value="Metro T9 Sport (Smart Scooter)">Metro T9 Sport — Graphene Smart Scooter (90 km Range)</option>
                <option value="Metro Metrix NCF (Long Range)">Metro Metrix NCF — 72V Smart Scooter (105 km Range)</option>
                <option value="Metro Miku Super Dual Lithium">Metro Miku Super — 3000W Dual Lithium Motorcycle (100 km/h)</option>
                <option value="Vlektra Retro (Café Racer EV)">Vlektra Retro — 72V Lithium Café Racer (100 km Range)</option>
                <option value="Vlektra Velocity (Naked Sport EV)">Vlektra Velocity — Naked Sport EV (85 km Range)</option>
                <option value="Vlektra Rex (Streetfighter EV)">Vlektra Rex — High-Performance Streetfighter (120 km Range)</option>
                <option value="REVOO A12 LFP Smart Scooter">REVOO A12 — LFP Battery Smart Scooter (100 km Range)</option>
                <option value="Ramza Liberty (Compact EV)">Ramza Liberty — Compact City EV (75 km Range)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zeeshan Ali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm font-bold text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="0300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm font-bold text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Preferred Showroom City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm font-bold text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none"
                  >
                    <option value="Lahore">Lahore (MM Alam Road)</option>
                    <option value="Karachi">Karachi (Clifton / Shahrah-e-Faisal)</option>
                    <option value="Islamabad">Islamabad (F-7 Markaz)</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Preferred Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm font-bold text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-2xl bg-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-md hover:bg-red-700 transition"
              >
                Confirm Test Ride Booking
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
