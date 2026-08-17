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
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const key = resolveDomainKey(category);
  const isVehicleVertical = isVehicleAgreementVertical(category);

  const agreementData = {
    transactionMode: value.transactionMode || 'sale', // sale, purchase, rental
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
    buyerCnic: value.buyerCnic || customer?.cnic || customer?.domain_data?.cnic || '',
    sellerCnic: value.sellerCnic || '',
    witness1Name: value.witness1Name || '',
    witness1Cnic: value.witness1Cnic || '',
    witness1Phone: value.witness1Phone || '',
    witness2Name: value.witness2Name || '',
    witness2Cnic: value.witness2Cnic || '',
    witness2Phone: value.witness2Phone || '',
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

  // Sync customer CNIC if updated
  useEffect(() => {
    if (customer?.cnic && !agreementData.buyerCnic) {
      updateField('buyerCnic', customer.cnic);
    }
  }, [customer?.cnic]);

  if (!isAutomotiveDomain(category)) return null;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 p-4 shadow-xs space-y-4">
      {/* Header Bar */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Vehicle Agreement & Delivery Specifications
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] uppercase font-semibold">
                {key.replace('-', ' ')}
              </Badge>
            </h4>
            <p className="text-xs text-slate-500">
              Registration, VIN/Chassis #, Engine #, Mileage, CNIC verification & Sales Agreement clauses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 text-[10px] font-semibold">
            {agreementData.transactionMode === 'sale'
              ? 'Vehicle Sale Invoice'
              : agreementData.transactionMode === 'purchase'
              ? 'Vehicle Trade-In Purchase'
              : 'Vehicle Rental Agreement'}
          </Badge>
          <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors p-1">
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

          {/* SECTION 2: Identification & Legal Witnesses */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              Buyer / Seller Identification & Legal Witnesses
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              {/* Buyer / Seller CNIC */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-indigo-800 uppercase block">Primary Parties</span>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-500 uppercase">Purchaser / Buyer CNIC</Label>
                  <Input
                    value={agreementData.buyerCnic}
                    onChange={(e) => updateField('buyerCnic', e.target.value)}
                    placeholder="35202-1234567-1"
                    className="h-8 text-xs font-mono bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-500 uppercase">Seller / Transferor CNIC</Label>
                  <Input
                    value={agreementData.sellerCnic}
                    onChange={(e) => updateField('sellerCnic', e.target.value)}
                    placeholder="35201-9876543-2"
                    className="h-8 text-xs font-mono bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Witness 1 */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase block">Witness 1 (Gawaah 1)</span>
                <Input
                  value={agreementData.witness1Name}
                  onChange={(e) => updateField('witness1Name', e.target.value)}
                  placeholder="Witness 1 Name"
                  className="h-8 text-xs bg-slate-50/50"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    value={agreementData.witness1Cnic}
                    onChange={(e) => updateField('witness1Cnic', e.target.value)}
                    placeholder="CNIC No"
                    className="h-8 text-xs font-mono bg-slate-50/50"
                  />
                  <Input
                    value={agreementData.witness1Phone}
                    onChange={(e) => updateField('witness1Phone', e.target.value)}
                    placeholder="Phone No"
                    className="h-8 text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Witness 2 */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase block">Witness 2 (Gawaah 2)</span>
                <Input
                  value={agreementData.witness2Name}
                  onChange={(e) => updateField('witness2Name', e.target.value)}
                  placeholder="Witness 2 Name"
                  className="h-8 text-xs bg-slate-50/50"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    value={agreementData.witness2Cnic}
                    onChange={(e) => updateField('witness2Cnic', e.target.value)}
                    placeholder="CNIC No"
                    className="h-8 text-xs font-mono bg-slate-50/50"
                  />
                  <Input
                    value={agreementData.witness2Phone}
                    onChange={(e) => updateField('witness2Phone', e.target.value)}
                    placeholder="Phone No"
                    className="h-8 text-xs bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Legal Terms & Ownership Clause */}
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
