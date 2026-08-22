'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Percent,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  calculateRegistrationCosts,
  DEFAULT_DEAL_PRESETS,
} from '@/lib/utils/registrationCostCalculator';
import { PLAN_TIERS } from '@/lib/config/plans';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

export function RegistrationCostCalculator({
  selectedPlan = 'starter',
  currency = 'PKR',
  regional = null,
  onChange = () => {},
  className = '',
}) {
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Default monthly price from plan
  const planInfo = PLAN_TIERS[selectedPlan] || PLAN_TIERS.starter;
  const defaultMonthly = currency === 'PKR' ? (planInfo.price_pkr || 0) : (planInfo.price_usd || 0);

  const [setupFee, setSetupFee] = useState(DEFAULT_DEAL_PRESETS.setupFee);
  const [trainingFee, setTrainingFee] = useState(DEFAULT_DEAL_PRESETS.trainingFee);
  const [supportFee, setSupportFee] = useState(DEFAULT_DEAL_PRESETS.supportFee);
  const [monthlyFee, setMonthlyFee] = useState(defaultMonthly);
  const [oneTimeDiscount, setOneTimeDiscount] = useState(0);
  const [monthlyDiscount, setMonthlyDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [notes, setNotes] = useState('');

  // Update monthly fee when plan changes
  useEffect(() => {
    const p = PLAN_TIERS[selectedPlan] || PLAN_TIERS.starter;
    const basePrice = currency === 'PKR' ? (p.price_pkr || 0) : (p.price_usd || 0);
    setMonthlyFee(basePrice);
  }, [selectedPlan, currency]);

  // Compute calculated terms
  const calculation = calculateRegistrationCosts({
    setupFee,
    trainingFee,
    supportFee,
    monthlyFee,
    oneTimeDiscount,
    monthlyDiscount,
    currency,
    notes,
  });

  // Notify parent on change
  useEffect(() => {
    onChange(calculation);
  }, [setupFee, trainingFee, supportFee, monthlyFee, oneTimeDiscount, monthlyDiscount, currency, notes, onChange]);

  const handleApplyPresetDiscount = (percent) => {
    const grossOneTime = setupFee + trainingFee + supportFee;
    const discountAmount = Math.round((grossOneTime * percent) / 100);
    setOneTimeDiscount(discountAmount);
  };

  return (
    <Card className={cn('border border-wine/15 shadow-sm rounded-xl overflow-hidden bg-white', className)}>
      <div className="bg-gradient-to-r from-wine/10 via-wine/5 to-transparent px-4 py-3 border-b border-wine/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-wine text-white flex items-center justify-center font-bold">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Project Pricing &amp; Custom Advance Payment
            </h4>
            <p className="text-[11px] text-gray-500 font-medium">
              Setup, training, support, monthly charges &amp; owner discounts
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCustomizer(!showCustomizer)}
          className="h-8 text-xs font-semibold border-wine/20 text-wine hover:bg-wine/5"
        >
          {showCustomizer ? (
            <>
              Hide Customizer <ChevronUp className="w-3.5 h-3.5 ml-1" />
            </>
          ) : (
            <>
              Customize Commercial Deal <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </>
          )}
        </Button>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Advance Payment Breakdown Summary Box */}
        <div className="rounded-xl border border-wine/20 bg-wine/[0.03] p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-wine/10 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Initial Advance Payment Breakdown
            </span>
            <Badge className="bg-wine/10 text-wine border-wine/20 text-[10px] font-bold">
              Advance Payable
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-white border border-gray-100">
              <span className="text-gray-600 font-medium">One-Time Costs (Setup, Training, Support):</span>
              <span className="font-semibold tabular-nums text-gray-900">
                {calculation.formatted.totalOneTimeGross}
              </span>
            </div>

            {calculation.oneTimeDiscount > 0 && (
              <div className="flex justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800">
                <span className="font-medium">One-Time Discount:</span>
                <span className="font-bold tabular-nums">
                  - {calculation.formatted.oneTimeDiscount}
                </span>
              </div>
            )}

            <div className="flex justify-between p-2 rounded-lg bg-white border border-gray-100">
              <span className="text-gray-600 font-medium">Net One-Time Setup:</span>
              <span className="font-semibold tabular-nums text-gray-900">
                {calculation.formatted.totalOneTimeNet}
              </span>
            </div>

            <div className="flex justify-between p-2 rounded-lg bg-white border border-gray-100">
              <span className="text-gray-600 font-medium">First Month Plan Charge ({planInfo.name}):</span>
              <span className="font-semibold tabular-nums text-gray-900">
                {calculation.formatted.firstMonthNet}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-wine text-white shadow-sm">
            <div>
              <p className="text-[10px] uppercase font-bold text-wine-100 tracking-widest">
                Total Advance Payment Payable
              </p>
              <p className="text-xl font-bold tabular-nums mt-0.5">
                {calculation.formatted.totalAdvancePayable}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-white/20 text-white px-2 py-1 rounded-md font-semibold">
                Includes Setup + Month 1
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Deal Customizer */}
        {showCustomizer && (
          <div className="space-y-3 pt-1 border-t border-gray-100 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-wine" />
                Customize Line Item Charges &amp; Discounts
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 font-semibold mr-1">Quick Discount:</span>
                {[10, 20, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleApplyPresetDiscount(pct)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-gray-200 hover:border-wine hover:text-wine bg-gray-50"
                  >
                    {pct}% Off
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Setup Fee</Label>
                <Input
                  type="number"
                  min="0"
                  value={setupFee}
                  onChange={(e) => setSetupFee(Number(e.target.value))}
                  className="h-9 text-xs font-semibold tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Training Fee</Label>
                <Input
                  type="number"
                  min="0"
                  value={trainingFee}
                  onChange={(e) => setTrainingFee(Number(e.target.value))}
                  className="h-9 text-xs font-semibold tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Support Fee</Label>
                <Input
                  type="number"
                  min="0"
                  value={supportFee}
                  onChange={(e) => setSupportFee(Number(e.target.value))}
                  className="h-9 text-xs font-semibold tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">One-Time Discount ({currency})</Label>
                <Input
                  type="number"
                  min="0"
                  value={oneTimeDiscount}
                  onChange={(e) => setOneTimeDiscount(Number(e.target.value))}
                  className="h-9 text-xs font-semibold tabular-nums text-emerald-700 border-emerald-200 bg-emerald-50/50"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Monthly Discount ({currency})</Label>
                <Input
                  type="number"
                  min="0"
                  value={monthlyDiscount}
                  onChange={(e) => setMonthlyDiscount(Number(e.target.value))}
                  className="h-9 text-xs font-semibold tabular-nums text-emerald-700 border-emerald-200 bg-emerald-50/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-gray-500">Commercial Deal Notes</Label>
              <Input
                placeholder="e.g., Owner requested 20% launch discount on setup & training"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
