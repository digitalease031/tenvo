'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { formatCurrency } from '@/lib/currency';
import { isEvBikesStore } from '@/lib/storefront/evBikesStorefront';
import { isAutoDealershipStore } from '@/lib/storefront/autoDealership';
import { isElectronicsElevatedStore } from '@/lib/storefront/electronicsStorefront';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';
import { resolveStorefrontProductBrowseHref } from '@/lib/storefront/storefrontPurchasability';
import {
  Calculator, FileText, Upload, CheckCircle2, ArrowRight,
  ShieldCheck, AlertCircle, Phone, Download, Sparkles, Building, UserCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const MARKUP_RATES = {
  12: 0.15, // 15% annual markup for 12m
  18: 0.20, // 20% markup for 18m
  24: 0.25, // 25% markup for 24m
  36: 0.35, // 35% markup for 36m
  48: 0.40, // 40% markup for 48m
  60: 0.48, // 48% markup for 60m
};

export function InstallmentPageClient({
  business,
  settings,
  products = [],
  contact,
}) {
  const { businessDomain, currency } = useStorefront();
  const categoryKey = business?.category;
  const storeName = business?.business_name || 'Store';

  const evStore = isEvBikesStore(categoryKey);
  const dealershipStore = isAutoDealershipStore(categoryKey);
  const electronicsStore = isElectronicsElevatedStore(categoryKey);
  const accent = getStoreAccentColor(settings, categoryKey) || '#dc2626';

  // Filter catalog products for model selection
  const catalogModels = useMemo(() => {
    if (!products || !products.length) return [];
    return products.filter((p) => {
      const cat = String(p.category || p.category_name || '').toLowerCase();
      return !cat.includes('charger') && !cat.includes('accessories') && !cat.includes('spares');
    });
  }, [products]);

  const availableModels = catalogModels.length ? catalogModels : products;

  // State: Calculator
  const [selectedProductId, setSelectedProductId] = useState(() => availableModels[0]?.id || '');
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [durationMonths, setDurationMonths] = useState(24);

  // Selected product
  const selectedProduct = availableModels.find((p) => String(p.id) === String(selectedProductId)) || availableModels[0];
  const productPrice = Number(selectedProduct?.price || 200000);

  // Calculations (Financial Math matching Screenshot 1)
  const downPaymentAmount = Math.round(productPrice * (downPaymentPct / 100));
  const totalFinanceAmount = Math.max(0, productPrice - downPaymentAmount);
  const markupRate = MARKUP_RATES[durationMonths] || 0.25;
  const totalWithMarkup = totalFinanceAmount * (1 + markupRate);
  const monthlyInstallment = Math.round(totalWithMarkup / durationMonths);
  const netMonthlyInstallment = monthlyInstallment;

  // Form State
  const formRef = useRef(null);
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [employmentType, setEmploymentType] = useState('salaried');
  const [nicFileName, setNicFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNicFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size exceeds 15MB limit');
        return;
      }
      setNicFileName(file.name);
    }
  };

  const handleDownloadForm = async () => {
    try {
      toast.loading('Generating Official TENVO Installment Form…', { id: 'pdf-gen' });
      const { generateInstallmentFormPdf } = await import('@/lib/pdf/installmentFormPdf');
      const doc = await generateInstallmentFormPdf({
        storeName: storeName || 'TENVO Flagship Showroom',
        selectedVehicle: selectedProduct?.name || 'Vehicle / Product Model',
        productPrice: productPrice || 245000,
        downPaymentAmount: downPaymentAmount || 49000,
        downPaymentPct: downPaymentPct || 20,
        durationMonths: durationMonths || 24,
        monthlyInstallment: monthlyInstallment || 10208,
        applicant: {
          fullName: fullName || '',
          cnic: cnic || '',
          fatherName: fatherName || '',
          phone: phone || '',
          email: email || '',
          city: city || '',
          employmentType: employmentType || 'salaried',
        },
        contact,
      });
      doc.save(`TENVO-Installment-Application-Form.pdf`);
      toast.success('TENVO Installment Application Form downloaded successfully!', { id: 'pdf-gen' });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Could not download form. Please try again.', { id: 'pdf-gen' });
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.length < 2) {
      toast.error('Please enter your full name');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!phone || phone.length < 7) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (!city.trim()) {
      toast.error('Please enter your city');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedMessage = `INSTALLMENT APPLICATION
Applicant Type: ${employmentType === 'salaried' ? 'Salaried Employee' : 'Self-Employed / Business Owner'}
Selected Model: ${selectedProduct?.name || 'Vehicle/Product'} (Price: ${formatCurrency(productPrice, currency)})
Down Payment: ${downPaymentPct}% (${formatCurrency(downPaymentAmount, currency)})
Financed Amount: ${formatCurrency(totalFinanceAmount, currency)}
Plan Duration: ${durationMonths} Months
Estimated Monthly Installment: ${formatCurrency(monthlyInstallment, currency)}/month
Applicant City: ${city}
Attached Document: ${nicFileName || 'Not uploaded online (will bring physical CNIC copy)'}`;

      const res = await fetch(`/api/storefront/${businessDomain}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          subject: 'installment',
          message: formattedMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application');

      setIsSubmittedSuccess(true);
      toast.success('Installment application submitted successfully!');
    } catch (err) {
      toast.error(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 bg-slate-50 text-slate-900 transition-colors selection:bg-red-600 selection:text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-700 border border-red-200 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-red-600" />
            Easy Installment Plans
          </span>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase text-slate-900">
            Installment Plan Calculator
          </h1>

          <p className="text-sm sm:text-base font-medium max-w-2xl mx-auto text-slate-600">
            Calculate your monthly payments for {storeName}. Choose your model, customize your down payment, select your duration, and apply online!
          </p>
        </div>

        {/* SECTION 1: INSTALLMENT PLAN CALCULATOR (Single Unified Card Container with Light Colors) */}
        <div className="rounded-3xl p-6 sm:p-8 border border-slate-200 bg-white text-slate-900 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* Left Controls Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Model Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-extrabold text-slate-900">
                  Choose your preferred model
                </label>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {availableModels.map((item) => {
                    const isSelected = String(item.id) === String(selectedProductId);
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          'flex items-center justify-between rounded-2xl px-4 py-3.5 border cursor-pointer transition text-xs sm:text-sm font-semibold',
                          isSelected
                            ? 'border-red-600 bg-red-50/80 text-slate-900 shadow-sm'
                            : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="preferredModel"
                            checked={isSelected}
                            onChange={() => setSelectedProductId(item.id)}
                            className="accent-red-600 h-4 w-4"
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-extrabold tabular-nums text-slate-900">
                          {formatCurrency(item.price, currency)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Down Payment Percentage Slider & Selector */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-extrabold text-slate-900">
                    Down Payment Percentage
                  </label>
                  <select
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-red-600 focus:outline-none shadow-sm"
                  >
                    {[10, 15, 20, 25, 30, 40, 50, 60, 70].map((pct) => (
                      <option key={pct} value={pct}>
                        {pct}%
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="range"
                  min="10"
                  max="70"
                  step="5"
                  value={downPaymentPct}
                  onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />

                <p className="text-xs text-slate-500 font-medium">
                  Select your down payment percentage ({downPaymentPct}% = {formatCurrency(downPaymentAmount, currency)}).
                </p>
              </div>

              {/* Duration Selector */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-extrabold text-slate-900">
                  Installment Duration (Months)
                </label>

                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-bold">
                  {[12, 18, 24, 36, 48, 60].map((months) => (
                    <label key={months} className="flex items-center gap-2 cursor-pointer text-slate-800">
                      <input
                        type="radio"
                        name="durationMonths"
                        checked={durationMonths === months}
                        onChange={() => setDurationMonths(months)}
                        className="accent-red-600 h-4 w-4"
                      />
                      <span>{months} Months</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Calculation Summary Box (Light Slate Theme) */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="rounded-2xl p-6 sm:p-8 border border-slate-200 bg-slate-50 text-slate-900 space-y-6 flex flex-col justify-between h-full">
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs sm:text-sm font-bold text-slate-700">Down Payment Amount:</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 tabular-nums">
                        {formatCurrency(downPaymentAmount, currency)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">The initial amount you will pay upfront.</p>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs sm:text-sm font-bold text-slate-700">Total Finance:</span>
                      <span className="text-sm sm:text-base font-black text-red-600 tabular-nums">
                        {formatCurrency(totalFinanceAmount, currency)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">The amount you will finance after down payment.</p>
                  </div>

                  <div className="border-t border-slate-200 pt-4 space-y-1">
                    <span className="block text-xs font-black uppercase tracking-wider text-slate-900">
                      MONTHLY INSTALLMENT:
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-red-600 tracking-tight tabular-nums">
                      {formatCurrency(monthlyInstallment, currency)}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">The monthly amount you need to pay.</p>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs sm:text-sm font-bold text-slate-700">Net Monthly Installment:</span>
                      <span className="text-sm font-black text-red-600 tabular-nums">
                        {formatCurrency(netMonthlyInstallment, currency)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Total amount/month post adjustments</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={scrollToForm}
                    className="w-full rounded-xl bg-red-600 px-6 py-4 text-sm font-black uppercase text-white shadow-md hover:bg-red-700 transition active:scale-95 text-center"
                  >
                    APPLY NOW
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: APPLY FOR INSTALLMENT FORM */}
        <div
          ref={formRef}
          className="rounded-3xl p-6 sm:p-12 border border-slate-200 bg-white text-slate-900 shadow-xl max-w-4xl mx-auto space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-900">
              APPLY FOR <span className="text-red-600">INSTALLMENT</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Submit your details to apply for an installment plan with {storeName}.
            </p>
          </div>

          {isSubmittedSuccess ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-8 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Application Submitted!</h3>
              <p className="text-xs sm:text-sm text-slate-700 max-w-lg mx-auto">
                Thank you, <span className="font-bold text-slate-900">{fullName}</span>. Your installment inquiry for{' '}
                <span className="font-bold text-red-600">{selectedProduct?.name}</span> has been received. Our team will contact you shortly.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setIsSubmittedSuccess(false)}
                  className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-6">
              {/* Applicant Info Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inst-fullname" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Full Name (as per CNIC) *
                    </label>
                    <input
                      id="inst-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="inst-cnic" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      CNIC Number *
                    </label>
                    <input
                      id="inst-cnic"
                      type="text"
                      value={cnic}
                      onChange={(e) => setCnic(e.target.value)}
                      placeholder="35202-1234567-1"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inst-father" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Father / Husband Name
                    </label>
                    <input
                      id="inst-father"
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="Father or Husband name"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Employment Status *
                    </label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-red-600 focus:outline-none transition"
                    >
                      <option value="salaried">Salaried Employee</option>
                      <option value="business">Self-Employed / Business Owner</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inst-email" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      id="inst-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@domain.com"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="inst-phone" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      id="inst-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300 1234567"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inst-city" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      id="inst-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Lahore, Karachi, Islamabad"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Installment Plan *
                    </label>
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold text-slate-800">
                      {[12, 18, 24, 36, 48, 60].map((m) => (
                        <label key={`plan-${m}`} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="planChoice"
                            checked={durationMonths === m}
                            onChange={() => setDurationMonths(m)}
                            className="accent-red-600"
                          />
                          <span>{m}-m</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Model Choice & File Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Model *
                    </label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                      {availableModels.slice(0, 5).map((m) => (
                        <label key={`form-model-${m.id}`} className="flex items-center gap-2 text-xs cursor-pointer font-medium text-slate-800">
                          <input
                            type="radio"
                            name="formModelChoice"
                            checked={String(m.id) === String(selectedProductId)}
                            onChange={() => setSelectedProductId(m.id)}
                            className="accent-red-600"
                          />
                          <span>{m.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Upload NIC Picture *
                    </label>
                    <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-center space-y-2">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleNicFileChange}
                        className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-500">
                        {nicFileName ? `Selected: ${nicFileName}` : 'Upload supported file (Max 15MB)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Guidance Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4 text-xs leading-relaxed text-slate-700">
                <p className="font-bold text-slate-900">
                  Please download the form and send the following documents to{' '}
                  <span className="text-red-600 font-bold">{contact?.email || 'support@tenvo.store'}</span>:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-red-600" />
                      For Salaried Employees:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                      <li>CNIC Copy</li>
                      <li>Salary slip (Last 3 Months)</li>
                      <li>Bank statement (Last 6 Months)</li>
                      <li>Utility bill copy</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-red-600" />
                      For Self-Employed or Business Holder:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                      <li>CNIC Copy</li>
                      <li>Bank statement (Last 6 Months)</li>
                      <li>Utility bill copy</li>
                      <li>FBR Registration and Tax Return Certificate</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadForm}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase text-white hover:bg-slate-800 transition shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    DOWNLOAD FORM
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto rounded-xl bg-red-600 px-10 py-4 text-sm font-black uppercase text-white shadow-xl hover:bg-red-700 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'SUBMITTING APPLICATION…' : 'APPLY NOW'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

