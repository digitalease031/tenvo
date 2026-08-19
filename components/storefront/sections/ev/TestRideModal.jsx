'use client';

import { useState } from 'react';
import { X, Calendar, MapPin, Zap, CheckCircle2, User, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Interactive Test Ride Modal for EV Bikes Storefront.
 * Allows visitors to request a free test ride for Vlektra, Metro EV, or Ramza models.
 */
export function TestRideModal({ isOpen, onClose, storeName = 'Tenvo EV', accent = '#10b981' }) {
  const [model, setModel] = useState('Vlektra Retro (Café Racer EV)');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lahore');
  const [date, setDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

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
    setName('');
    setPhone('');
    setDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-500/30 bg-neutral-900 text-white shadow-2xl">
        {/* Neon Glow Accent Header */}
        <div className="relative p-6 bg-gradient-to-r from-emerald-950 via-neutral-900 to-neutral-950 border-b border-emerald-500/20">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-2">
            <Zap className="h-3.5 w-3.5 fill-emerald-400" />
            Free Showroom Experience
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Book Your Free Test Ride
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Experience instant electric torque and zero noise at {storeName}.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-bold text-white">Test Ride Scheduled!</h4>
            <p className="text-sm text-neutral-300">
              Thank you <span className="font-semibold text-emerald-400">{name}</span>. Your test ride for{' '}
              <span className="font-semibold text-emerald-400">{model}</span> has been logged.
            </p>
            <p className="text-xs text-neutral-400">
              Our EV specialist will call you at <span className="font-mono text-neutral-200">{phone}</span> to confirm your slot in {city}.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="w-full mt-4 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-500 transition"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Select EV Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Vlektra Retro (Café Racer EV)">Vlektra Retro — 72V Lithium Café Racer (100 km Range)</option>
                <option value="Vlektra Velocity (Naked Sport EV)">Vlektra Velocity — Naked Sport EV (85 km Range)</option>
                <option value="Vlektra Rex (Streetfighter EV)">Vlektra Rex — High-Performance Streetfighter (120 km Range)</option>
                <option value="Metro T9 Sport (Smart Scooter)">Metro T9 Sport — Graphene Smart Scooter (90 km Range)</option>
                <option value="Metro Metrix NCF (Long Range)">Metro Metrix NCF — 72V Smart Scooter (105 km Range)</option>
                <option value="Ramza Liberty (Compact EV)">Ramza Liberty — Compact City EV (75 km Range)</option>
                <option value="Ramza Liberty Ultra">Ramza Liberty Ultra — Azure Controller EV (95 km Range)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zeeshan Ali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800 pl-9 pr-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="tel"
                    required
                    placeholder="0300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800 pl-9 pr-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Preferred Showroom City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800 pl-9 pr-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
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
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Preferred Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800 pl-9 pr-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition"
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
