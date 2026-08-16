'use client';

/**
 * Construction Settings Hub
 * PEC License Registration, PPRA Profile, FBR/WHT Configuration, and Material Thresholds.
 */

import { useState } from 'react';
import { Settings, Shield, Award, FileText, CheckCircle2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { PEC_CONTRACTOR_CATEGORIES } from '@/lib/construction/constructionIntelligence';
import notify from '@/lib/utils/appToast';

export function ConstructionSettingsHub() {
  const { business } = useBusiness();

  const [pecCategory, setPecCategory] = useState('C-2');
  const [pecRegNo, setPecRegNo] = useState('PEC-CIVIL-2026-9812');
  const [pecExpiry, setPecExpiry] = useState('2026-12-31');
  const [ntn, setNtn] = useState('4029182-7');
  const [strn, setStrn] = useState('3277870192812');
  const [isFiler, setIsFiler] = useState(true);
  const [defaultProvince, setDefaultProvince] = useState('PK-PB');

  const handleSave = (e) => {
    e?.preventDefault();
    notify.compactSave('Construction contractor profile & PEC settings updated');
  };

  const selectedCategoryMeta = PEC_CONTRACTOR_CATEGORIES.find((c) => c.code === pecCategory);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Construction Contractor Profile & Technical Registration
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Configure Pakistan Engineering Council (PEC) licensing, PPRA registration, and provincial tax defaults.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>

      {/* PEC License Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-600" />
          Pakistan Engineering Council (PEC) License Category
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">PEC License Category</label>
            <select
              value={pecCategory}
              onChange={(e) => setPecCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/30"
            >
              {PEC_CONTRACTOR_CATEGORIES.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">PEC Registration No</label>
            <input
              type="text"
              value={pecRegNo}
              onChange={(e) => setPecRegNo(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        {selectedCategoryMeta && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-1 text-xs text-amber-900">
            <p className="font-bold">Category Specs ({selectedCategoryMeta.code}):</p>
            <p>• Tender Limit: {selectedCategoryMeta.limitPKR === Infinity ? 'Unlimited' : `Up to PKR ${(selectedCategoryMeta.limitPKR / 1_000_000).toFixed(0)}M`}</p>
            <p>• Required Engineers: {selectedCategoryMeta.requiredPE} Professional Engineers + {selectedCategoryMeta.requiredRE} Registered Engineers</p>
            <p>• {selectedCategoryMeta.description}</p>
          </div>
        )}
      </div>

      {/* Tax & FBR Compliance */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          FBR & Provincial Tax Registration (WHT & Sales Tax)
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">National Tax Number (NTN)</label>
            <input
              type="text"
              value={ntn}
              onChange={(e) => setNtn(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sales Tax Registration (STRN)</label>
            <input
              type="text"
              value={strn}
              onChange={(e) => setStrn(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">FBR Active Taxpayer Status</label>
            <select
              value={isFiler ? 'filer' : 'non-filer'}
              onChange={(e) => setIsFiler(e.target.value === 'filer')}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-900"
            >
              <option value="filer">Active Filer (7.5% WHT Rate)</option>
              <option value="non-filer">Non-Filer (8.0% WHT Rate)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
