'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import { ChevronDown, RefreshCw, Calculator } from 'lucide-react';

const PETROL_BIKE_PRESETS = [
  { id: 'cd70', name: 'CD-70', avgKmLiter: 45 },
  { id: 'cg125', name: 'CG-125', avgKmLiter: 35 },
  { id: 'ybr125', name: 'YBR 125', avgKmLiter: 38 },
  { id: 'united70', name: 'United 70', avgKmLiter: 42 },
  { id: 'custom', name: 'Custom Petrol Bike', avgKmLiter: 40 },
];

export function EvBikesSavingsCalculator({
  products = [],
  currency = 'PKR',
  storeName = 'Metro',
}) {
  // Ev model list from products
  const evModels = useMemo(() => {
    if (!products || !products.length) return [];
    return products.filter((p) => {
      const cat = String(p.category || p.category_name || '').toLowerCase();
      return !cat.includes('charger') && !cat.includes('accessories') && !cat.includes('spares');
    });
  }, [products]);

  // Form State
  const [selectedPetrolBike, setSelectedPetrolBike] = useState('cd70');
  const [monthlyTravelKm, setMonthlyTravelKm] = useState(900);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(280);

  const [selectedEvModelId, setSelectedEvModelId] = useState('');
  const [evBatteryRange, setEvBatteryRange] = useState(110);
  const [electricityRatePerUnit, setElectricityRatePerUnit] = useState(40);

  // Calculated Results
  const [isCalculated, setIsCalculated] = useState(true);

  // Compute petrol & electric cost
  const petrolBike = PETROL_BIKE_PRESETS.find((b) => b.id === selectedPetrolBike) || PETROL_BIKE_PRESETS[0];
  const kmPerLiter = petrolBike.avgKmLiter || 45;

  const monthlyPetrolCost = Math.max(0, Math.round(((monthlyTravelKm || 0) / kmPerLiter) * (fuelPricePerLiter || 0)));

  // EV charging cost: typical 72V 27Ah pack takes approx 2.0 kWh (units) for 100-110 km
  const kmPerEvUnit = (evBatteryRange || 110) / 2.0; // km per electricity unit (kWh)
  const monthlyEvUnits = (monthlyTravelKm || 0) / Math.max(1, kmPerEvUnit);
  const monthlyElectricCost = Math.max(0, Math.round(monthlyEvUnits * (electricityRatePerUnit || 0)));

  const estimatedMonthlySavings = Math.max(0, monthlyPetrolCost - monthlyElectricCost);
  const estimatedYearlySavings = estimatedMonthlySavings * 12;

  const handleEvModelChange = (modelId) => {
    setSelectedEvModelId(modelId);
    const found = evModels.find((m) => String(m.id) === String(modelId));
    if (found) {
      const dd = found.domain_data || {};
      const range = parseInt(dd.range_km || dd.range || 110, 10);
      if (!isNaN(range) && range > 0) {
        setEvBatteryRange(range);
      }
    }
  };

  const handleReset = () => {
    setSelectedPetrolBike('cd70');
    setMonthlyTravelKm(900);
    setFuelPricePerLiter(280);
    setSelectedEvModelId('');
    setEvBatteryRange(110);
    setElectricityRatePerUnit(40);
    setIsCalculated(true);
  };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-12 py-12 bg-slate-100/70 border-y border-slate-200">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-12 shadow-sm">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold text-red-600 tracking-widest uppercase">
            Calculate Your Savings
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Discover How Much You Can Save with {storeName} E-Vehicles
          </h2>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">
            Use our Savings Calculator to compare fuel costs with electric power. See your monthly and yearly savings by switching to a cost-effective {storeName} E-Vehicle today!
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsCalculated(true);
          }}
          className="space-y-8 max-w-5xl mx-auto"
        >
          {/* Sub-Section 1: Current Vehicle Details */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
              Current Vehicle Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="ev-calc-petrol-bike" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Petrol Bike
                </label>
                <div className="relative">
                  <select
                    id="ev-calc-petrol-bike"
                    value={selectedPetrolBike}
                    onChange={(e) => setSelectedPetrolBike(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-bold text-slate-900 shadow-sm focus:border-red-600 focus:bg-white focus:outline-none pr-9 cursor-pointer"
                  >
                    {PETROL_BIKE_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="ev-calc-monthly-travel" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Average Monthly Travel (km)
                </label>
                <input
                  id="ev-calc-monthly-travel"
                  type="number"
                  min="50"
                  max="10000"
                  value={monthlyTravelKm}
                  onChange={(e) => setMonthlyTravelKm(Number(e.target.value))}
                  placeholder="Average Monthly Travel"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-bold text-slate-900 shadow-sm focus:border-red-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="ev-calc-fuel-price" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Fuel Price (per liter)
                </label>
                <input
                  id="ev-calc-fuel-price"
                  type="number"
                  min="100"
                  max="1000"
                  value={fuelPricePerLiter}
                  onChange={(e) => setFuelPricePerLiter(Number(e.target.value))}
                  placeholder="e.g 280"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-bold text-slate-900 shadow-sm focus:border-red-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sub-Section 2: Metro Vehicle Details */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2">
              {storeName} Vehicle Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="ev-calc-model-select" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Product Model
                </label>
                <div className="relative">
                  <select
                    id="ev-calc-model-select"
                    value={selectedEvModelId}
                    onChange={(e) => handleEvModelChange(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-bold text-slate-900 shadow-sm focus:border-red-600 focus:bg-white focus:outline-none pr-9 cursor-pointer"
                  >
                    <option value="">Select Product Model</option>
                    {evModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="ev-calc-battery-range" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Battery Range (per charge)
                </label>
                <input
                  id="ev-calc-battery-range"
                  type="number"
                  min="30"
                  max="300"
                  value={evBatteryRange}
                  onChange={(e) => setEvBatteryRange(Number(e.target.value))}
                  placeholder="Battery Range (km)"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-bold text-slate-900 shadow-sm focus:border-red-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="ev-calc-electricity-rate" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Electricity Rate (per unit)
                </label>
                <input
                  id="ev-calc-electricity-rate"
                  type="number"
                  min="5"
                  max="200"
                  value={electricityRatePerUnit}
                  onChange={(e) => setElectricityRatePerUnit(Number(e.target.value))}
                  placeholder="e.g 40"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-bold text-slate-900 shadow-sm focus:border-red-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-7 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition active:scale-95"
            >
              <Calculator className="h-4 w-4 text-white" />
              Get Estimate
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Form
            </button>
          </div>

          {/* Output Display Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm space-y-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase">Monthly Petrol Cost</p>
              <p className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight tabular-nums">
                {isCalculated ? formatCurrency(monthlyPetrolCost, currency) : 0}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm space-y-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase">Monthly Electric Cost</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {isCalculated ? formatCurrency(monthlyElectricCost, currency) : 0}
              </p>
            </div>

            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm space-y-2">
              <p className="text-xs font-extrabold text-red-700 uppercase">Estimated Monthly Savings</p>
              <p className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight tabular-nums">
                {isCalculated ? formatCurrency(estimatedMonthlySavings, currency) : 0}
              </p>
            </div>

            <div className="rounded-3xl border border-red-600 bg-red-600 p-6 shadow-md space-y-2 text-white">
              <p className="text-xs font-extrabold text-red-100 uppercase">Estimated Yearly Savings</p>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
                {isCalculated ? formatCurrency(estimatedYearlySavings, currency) : 0}
              </p>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
