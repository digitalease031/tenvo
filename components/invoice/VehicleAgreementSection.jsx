'use client';

import React, { useState, useEffect } from 'react';
import {
  Car,
  FileCheck,
  UserCheck,
  Shield,
  Calendar,
  Gauge,
  KeyRound,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';

import { formatBusinessAddressBlock } from '@/lib/pdf/invoiceFormat';

/**
 * Checks if category is an automotive vehicle domain.
 */
export function isAutomotiveDomain(category) {
  const key = resolveDomainKey(category);
  return ['vehicle-dealership', 'auto-marketplace', 'rent-a-car', 'auto-parts', 'auto-workshop'].includes(key);
}

/**
 * Checks if category is a vehicle sales / rental vertical (Dealership, Marketplace, Rent-a-Car).
 */
export function isVehicleAgreementVertical(category) {
  const key = resolveDomainKey(category);
  return ['vehicle-dealership', 'auto-marketplace', 'rent-a-car'].includes(key);
}

/**
 * VehicleAgreementSection Component
 * Dedicated Vehicle Specifications, Buyer/Seller Identification, and Sales/Delivery Agreement block
 * for Vehicle Dealerships, Auto Marketplaces, and Rent-a-Car businesses.
 *
 * @param {Object} props
 * @param {Object} props.value - Vehicle agreement state object
 * @param {(val: Object) => void} props.onChange - Handler to update vehicle agreement state
 * @param {string} props.category - Business category
 * @param {Object} [props.customer] - Selected customer details
 */
export function VehicleAgreementSection({
  value = {},
  onChange,
  category = 'vehicle-dealership',
  customer = null,
  business = null,
  onPrintReceipt = null,
  onDownloadPdf = null,
  onDownloadInstallmentForm = null,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const key = resolveDomainKey(category);
  const isVehicleVertical = isVehicleAgreementVertical(category);

  const defaultBuyerAddress =
    customer?.address || [customer?.city, customer?.state].filter(Boolean).join(', ') || '';
  const defaultSellerAddress =
    (business ? formatBusinessAddressBlock(business).join(', ') : '') || business?.address || '';

  const agreementData = {
    transactionMode: value.transactionMode || 'sale', // sale, purchase, rental, installment
    registrationNo: value.registrationNo || '',
    chassisNo: value.chassisNo || '',
    engineNo: value.engineNo || '',
    mileage: value.mileage || '',
    makeModel: value.makeModel || '',
    modelYear: value.modelYear || '',
    color: value.color || '',
    bodyType: value.bodyType || 'Sedan',
    transmission: value.transmission || 'Automatic',
    fuelType: value.fuelType || 'Petrol',
    tokenTaxStatus: value.tokenTaxStatus || 'Paid',
    conditionGrade: value.conditionGrade || 'Certified Pre-Owned',
    buyerName: value.buyerName || customer?.name || '',
    buyerPhone: value.buyerPhone || customer?.phone || '',
    buyerCnic: value.buyerCnic || customer?.cnic || customer?.domain_data?.cnic || '',
    buyerAddress: value.buyerAddress || defaultBuyerAddress,
    fatherName: value.fatherName || '',
    employmentType: value.employmentType || 'salaried',
    employerName: value.employerName || '',
    monthlyIncome: value.monthlyIncome || '',
    sellerName: value.sellerName || business?.name || '',
    sellerPhone: value.sellerPhone || business?.phone || business?.phone_number || '',
    sellerCnic: value.sellerCnic || business?.cnic || business?.ntn || '',
    sellerAddress: value.sellerAddress || defaultSellerAddress,
    downPaymentPct: value.downPaymentPct ?? 20,
    downPaymentAmount: value.downPaymentAmount || '',
    durationMonths: value.durationMonths ?? 24,
    markupPct: value.markupPct ?? 15,
    monthlyInstallment: value.monthlyInstallment || '',
    witness1Name: value.witness1Name || '',
    witness1Cnic: value.witness1Cnic || '',
    witness1Phone: value.witness1Phone || '',
    witness1Relation: value.witness1Relation || '',
    witness1City: value.witness1City || '',
    witness2Name: value.witness2Name || '',
    witness2Cnic: value.witness2Cnic || '',
    witness2Phone: value.witness2Phone || '',
    witness2Relation: value.witness2Relation || '',
    witness2City: value.witness2City || '',
    ownershipTransferTerms:
      value.ownershipTransferTerms ||
      'Vehicle delivered in good condition. Ownership transfer to be completed within 30 days of sale.',
    titleGuarantee: value.titleGuarantee ?? true,
  };

  const updateField = (field, val) => {
    onChange({
      ...agreementData,
      [field]: val,
    });
  };

  // Sync customer & business defaults if updated
  useEffect(() => {
    let updated = false;
    const patch = { ...agreementData };

    if (customer?.name && !agreementData.buyerName) { patch.buyerName = customer.name; updated = true; }
    if (customer?.phone && !agreementData.buyerPhone) { patch.buyerPhone = customer.phone; updated = true; }
    if ((customer?.cnic || customer?.domain_data?.cnic) && !agreementData.buyerCnic) {
      patch.buyerCnic = customer.cnic || customer.domain_data?.cnic;
      updated = true;
    }
    if (defaultBuyerAddress && !agreementData.buyerAddress) {
      patch.buyerAddress = defaultBuyerAddress;
      updated = true;
    }
    if (business?.name && !agreementData.sellerName) { patch.sellerName = business.name; updated = true; }
    if ((business?.phone || business?.phone_number) && !agreementData.sellerPhone) {
      patch.sellerPhone = business.phone || business.phone_number;
      updated = true;
    }
    if ((business?.cnic || business?.ntn) && !agreementData.sellerCnic) {
      patch.sellerCnic = business.cnic || business.ntn;
      updated = true;
    }
    if (defaultSellerAddress && !agreementData.sellerAddress) {
      patch.sellerAddress = defaultSellerAddress;
      updated = true;
    }

    if (updated) {
      onChange(patch);
    }
  }, [
    customer?.name,
    customer?.phone,
    customer?.cnic,
    customer?.address,
    customer?.city,
    business?.name,
    business?.phone,
    business?.cnic,
    business?.ntn,
    business?.address,
    business?.city,
  ]);

  if (!isAutomotiveDomain(category)) return null;

  const missingBuyerPhone = !agreementData.buyerPhone;
  const missingBuyerCnic = !agreementData.buyerCnic;
  const missingSellerPhone = !agreementData.sellerPhone;
  const missingSellerCnic = !agreementData.sellerCnic;
  const hasMissingMandatoryPartyInfo = missingBuyerPhone || missingBuyerCnic || missingSellerPhone || missingSellerCnic;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 p-4 shadow-xs space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
        <div
          className="flex items-center gap-2.5 cursor-pointer flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
              Vehicle Agreement & Delivery Specifications
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] uppercase font-semibold">
                {key.replace('-', ' ')}
              </Badge>
              {hasMissingMandatoryPartyInfo && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] uppercase font-semibold">
                  ⚠️ Phone & CNIC Required
                </Badge>
              )}
            </h4>
            <p className="text-xs text-slate-500">
              Mandatory Buyer & Seller Phone + CNIC, VIN/Chassis #, Engine #, Odometer & Buyer-Seller Receipt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onPrintReceipt && (
            <button
              type="button"
              onClick={onPrintReceipt}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              🖨️ Print Receipt
            </button>
          )}
          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              📥 Download PDF
            </button>
          )}
          {onDownloadInstallmentForm && (
            <button
              type="button"
              onClick={onDownloadInstallmentForm}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs flex items-center gap-1.5"
              title="Download Official Installment Application Form PDF"
            >
              📄 Installment Form
            </button>
          )}
          <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 text-[10px] font-semibold hidden sm:inline-flex">
            {agreementData.transactionMode === 'sale'
              ? 'Vehicle Sale Invoice'
              : agreementData.transactionMode === 'purchase'
              ? 'Vehicle Trade-In Purchase'
              : agreementData.transactionMode === 'installment'
              ? 'Vehicle Installment Lease'
              : 'Vehicle Rental Agreement'}
          </Badge>
          <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-indigo-100">
          {/* Transaction Mode Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-600 px-2 uppercase">Transaction Mode:</span>
            {[
              { id: 'sale', label: '🚗 Vehicle Sale Invoice & Delivery Receipt' },
              { id: 'purchase', label: '📥 Vehicle Trade-In / Purchase Receipt' },
              { id: 'installment', label: '📄 Easy Installments / Leasing' },
              { id: 'rental', label: '🔑 Rent-a-Car Agreement' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => updateField('transactionMode', mode.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  agreementData.transactionMode === mode.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* SECTION 1: Vehicle Specifications */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-indigo-600" />
              Vehicle Technical Specifications
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Reg Plate # *</Label>
                <Input
                  value={agreementData.registrationNo}
                  onChange={(e) => updateField('registrationNo', e.target.value.toUpperCase())}
                  placeholder="e.g. LEB-2024-8891"
                  className="h-8 text-xs font-mono font-bold uppercase bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Chassis / VIN # *</Label>
                <Input
                  value={agreementData.chassisNo}
                  onChange={(e) => updateField('chassisNo', e.target.value.toUpperCase())}
                  placeholder="e.g. NZE140-9081234"
                  className="h-8 text-xs font-mono uppercase bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Engine # *</Label>
                <Input
                  value={agreementData.engineNo}
                  onChange={(e) => updateField('engineNo', e.target.value.toUpperCase())}
                  placeholder="e.g. 2ZR-8912345"
                  className="h-8 text-xs font-mono uppercase bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Odometer (KM) *</Label>
                <Input
                  type="number"
                  value={agreementData.mileage}
                  onChange={(e) => updateField('mileage', e.target.value)}
                  placeholder="e.g. 45000"
                  className="h-8 text-xs font-semibold bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Model Year</Label>
                <select
                  value={agreementData.modelYear}
                  onChange={(e) => updateField('modelYear', e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2 text-xs font-medium"
                >
                  <option value="">Select Year</option>
                  {['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'].map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Make & Model</Label>
                <Input
                  value={agreementData.makeModel}
                  onChange={(e) => updateField('makeModel', e.target.value)}
                  placeholder="e.g. Toyota Corolla Altis"
                  className="h-8 text-xs font-semibold bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Color & Shade</Label>
                <Input
                  value={agreementData.color}
                  onChange={(e) => updateField('color', e.target.value)}
                  placeholder="e.g. Super White Pearl"
                  className="h-8 text-xs bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Transmission</Label>
                <select
                  value={agreementData.transmission}
                  onChange={(e) => updateField('transmission', e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2 text-xs font-medium"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="CVT">CVT / e-CVT</option>
                  <option value="Manual">Manual</option>
                  <option value="7DCT">7DCT</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Fuel Type</Label>
                <select
                  value={agreementData.fuelType}
                  onChange={(e) => updateField('fuelType', e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2 text-xs font-medium"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Electric">Electric (EV)</option>
                  <option value="Diesel">Diesel</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Token Tax Status</Label>
                <Input
                  value={agreementData.tokenTaxStatus}
                  onChange={(e) => updateField('tokenTaxStatus', e.target.value)}
                  placeholder="e.g. Paid up to June 2026"
                  className="h-8 text-xs bg-slate-50/50"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Inspection & Grade</Label>
                <Input
                  value={agreementData.conditionGrade}
                  onChange={(e) => updateField('conditionGrade', e.target.value)}
                  placeholder="e.g. Grade 4.5 / Certified Pre-Owned"
                  className="h-8 text-xs bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Mandatory Buyer & Seller Identification & Legal Witnesses */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                Buyer & Seller Mandatory Identification & Legal Witnesses
              </span>
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Mandatory Phone & CNIC Required
              </span>
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              {/* Buyer Block */}
              <div className="space-y-2 bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100">
                <span className="text-[11px] font-bold text-indigo-900 uppercase block">Purchaser / Buyer</span>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-600 uppercase">Buyer Full Name</Label>
                  <Input
                    value={agreementData.buyerName}
                    onChange={(e) => updateField('buyerName', e.target.value)}
                    placeholder="Purchaser Name"
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-600 uppercase flex items-center justify-between">
                    <span>Buyer Phone <span className="text-red-500">*</span></span>
                    {missingBuyerPhone && <span className="text-[9px] text-red-600 font-bold">Required</span>}
                  </Label>
                  <Input
                    value={agreementData.buyerPhone}
                    onChange={(e) => updateField('buyerPhone', e.target.value)}
                    placeholder="0300-1234567"
                    className={cn("h-8 text-xs bg-white font-medium", missingBuyerPhone && "border-red-300 bg-red-50/30")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-600 uppercase flex items-center justify-between">
                    <span>Buyer CNIC <span className="text-red-500">*</span></span>
                    {missingBuyerCnic && <span className="text-[9px] text-red-600 font-bold">Required</span>}
                  </Label>
                  <Input
                    value={agreementData.buyerCnic}
                    onChange={(e) => updateField('buyerCnic', e.target.value)}
                    placeholder="35202-1234567-1"
                    className={cn("h-8 text-xs font-mono bg-white", missingBuyerCnic && "border-red-300 bg-red-50/30")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-600 uppercase">Buyer Residential Address</Label>
                  <Input
                    value={agreementData.buyerAddress}
                    onChange={(e) => updateField('buyerAddress', e.target.value)}
                    placeholder="Full Address / City"
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-600 uppercase">Father / Husband Name</Label>
                  <Input
                    value={agreementData.fatherName}
                    onChange={(e) => updateField('fatherName', e.target.value)}
                    placeholder="Father/Husband Name"
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-600 uppercase">Employment Status</Label>
                  <select
                    value={agreementData.employmentType}
                    onChange={(e) => updateField('employmentType', e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium"
                  >
                    <option value="salaried">Salaried Employee</option>
                    <option value="business">Self-Employed / Business Owner</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-600 uppercase">Employer/Co.</Label>
                    <Input
                      value={agreementData.employerName}
                      onChange={(e) => updateField('employerName', e.target.value)}
                      placeholder="Employer Name"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-600 uppercase">Income (PKR)</Label>
                    <Input
                      type="number"
                      value={agreementData.monthlyIncome}
                      onChange={(e) => updateField('monthlyIncome', e.target.value)}
                      placeholder="e.g. 150000"
                      className="h-8 text-xs bg-white font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Seller Block */}
              <div className="space-y-2 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-800 uppercase block">Seller / Transferor</span>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-600 uppercase">Seller / Showroom Name</Label>
                  <Input
                    value={agreementData.sellerName}
                    onChange={(e) => updateField('sellerName', e.target.value)}
                    placeholder="Showroom Name"
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-600 uppercase flex items-center justify-between">
                    <span>Seller Phone <span className="text-red-500">*</span></span>
                    {missingSellerPhone && <span className="text-[9px] text-red-600 font-bold">Required</span>}
                  </Label>
                  <Input
                    value={agreementData.sellerPhone}
                    onChange={(e) => updateField('sellerPhone', e.target.value)}
                    placeholder="0321-9876543"
                    className={cn("h-8 text-xs bg-white font-medium", missingSellerPhone && "border-red-300 bg-red-50/30")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-600 uppercase flex items-center justify-between">
                    <span>Seller CNIC / NTN <span className="text-red-500">*</span></span>
                    {missingSellerCnic && <span className="text-[9px] text-red-600 font-bold">Required</span>}
                  </Label>
                  <Input
                    value={agreementData.sellerCnic}
                    onChange={(e) => updateField('sellerCnic', e.target.value)}
                    placeholder="35201-9876543-2"
                    className={cn("h-8 text-xs font-mono bg-white", missingSellerCnic && "border-red-300 bg-red-50/30")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-600 uppercase">Seller / Showroom Address</Label>
                  <Input
                    value={agreementData.sellerAddress}
                    onChange={(e) => updateField('sellerAddress', e.target.value)}
                    placeholder="Showroom Address / Location"
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Witness 1 */}
              <div className="space-y-2 p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-[11px] font-bold text-slate-700 uppercase block">Witness 1 (Gawaah 1)</span>
                <Input
                  value={agreementData.witness1Name}
                  onChange={(e) => updateField('witness1Name', e.target.value)}
                  placeholder="Witness 1 Name"
                  className="h-8 text-xs bg-slate-50/50"
                />
                <Input
                  value={agreementData.witness1Phone}
                  onChange={(e) => updateField('witness1Phone', e.target.value)}
                  placeholder="Phone No"
                  className="h-8 text-xs bg-slate-50/50"
                />
                <Input
                  value={agreementData.witness1Cnic}
                  onChange={(e) => updateField('witness1Cnic', e.target.value)}
                  placeholder="CNIC No"
                  className="h-8 text-xs font-mono bg-slate-50/50"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    value={agreementData.witness1Relation}
                    onChange={(e) => updateField('witness1Relation', e.target.value)}
                    placeholder="Relation"
                    className="h-7 text-[11px] bg-slate-50/50"
                  />
                  <Input
                    value={agreementData.witness1City}
                    onChange={(e) => updateField('witness1City', e.target.value)}
                    placeholder="City"
                    className="h-7 text-[11px] bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Witness 2 */}
              <div className="space-y-2 p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-[11px] font-bold text-slate-700 uppercase block">Witness 2 (Gawaah 2)</span>
                <Input
                  value={agreementData.witness2Name}
                  onChange={(e) => updateField('witness2Name', e.target.value)}
                  placeholder="Witness 2 Name"
                  className="h-8 text-xs bg-slate-50/50"
                />
                <Input
                  value={agreementData.witness2Phone}
                  onChange={(e) => updateField('witness2Phone', e.target.value)}
                  placeholder="Phone No"
                  className="h-8 text-xs bg-slate-50/50"
                />
                <Input
                  value={agreementData.witness2Cnic}
                  onChange={(e) => updateField('witness2Cnic', e.target.value)}
                  placeholder="CNIC No"
                  className="h-8 text-xs font-mono bg-slate-50/50"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    value={agreementData.witness2Relation}
                    onChange={(e) => updateField('witness2Relation', e.target.value)}
                    placeholder="Relation"
                    className="h-7 text-[11px] bg-slate-50/50"
                  />
                  <Input
                    value={agreementData.witness2City}
                    onChange={(e) => updateField('witness2City', e.target.value)}
                    placeholder="City"
                    className="h-7 text-[11px] bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Installment Financing Plan & Calculation Settings */}
          {agreementData.transactionMode === 'installment' && (
            <div className="space-y-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
              <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                Installment Financing & Payment Schedule Calculator
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-emerald-800 uppercase">Down Payment (%)</Label>
                  <Input
                    type="number"
                    value={agreementData.downPaymentPct}
                    onChange={(e) => updateField('downPaymentPct', Number(e.target.value))}
                    placeholder="20"
                    className="h-8 text-xs font-bold bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-emerald-800 uppercase">Down Payment (PKR)</Label>
                  <Input
                    type="number"
                    value={agreementData.downPaymentAmount}
                    onChange={(e) => updateField('downPaymentAmount', e.target.value)}
                    placeholder="Down Payment"
                    className="h-8 text-xs font-semibold bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-emerald-800 uppercase">Duration (Months)</Label>
                  <select
                    value={agreementData.durationMonths}
                    onChange={(e) => updateField('durationMonths', Number(e.target.value))}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold"
                  >
                    {[12, 18, 24, 36, 48, 60].map((m) => (
                      <option key={m} value={m}>
                        {m} Months
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-emerald-800 uppercase">Annual Profit Rate (%)</Label>
                  <Input
                    type="number"
                    value={agreementData.markupPct}
                    onChange={(e) => updateField('markupPct', Number(e.target.value))}
                    placeholder="15"
                    className="h-8 text-xs font-semibold bg-white"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label className="text-[10px] font-semibold text-emerald-800 uppercase">Monthly Installment (PKR)</Label>
                  <Input
                    type="number"
                    value={agreementData.monthlyInstallment}
                    onChange={(e) => updateField('monthlyInstallment', e.target.value)}
                    placeholder="e.g. 25000"
                    className="h-8 text-xs font-bold text-emerald-700 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Legal Terms & Ownership Clause */}
          <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              Ownership Transfer Warranty & Legal Agreement Clauses
            </Label>
            <Input
              value={agreementData.ownershipTransferTerms}
              onChange={(e) => updateField('ownershipTransferTerms', e.target.value)}
              className="h-9 text-xs bg-slate-50/50 font-medium text-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
