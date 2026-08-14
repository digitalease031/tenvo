'use client';

/**
 * Material Rate Dashboard
 * Displays current market rates for construction materials with search, filter, and comparison tools.
 * Uses 2026 Pakistani market rates from constructionIntelligence.js
 */

import { useState, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, Info, Calculator, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PK_CONSTRUCTION_MATERIAL_RATES_2026 } from '@/lib/construction/constructionIntelligence';
import { useBusiness } from '@/lib/context/BusinessContext';

// ── Material Categories ──────────────────────────────────────────────────────

const MATERIAL_CATEGORIES = [
  { id: 'all', label: 'All Materials', icon: DollarSign },
  { id: 'steel', label: 'Steel & Rebar', icon: TrendingUp },
  { id: 'cement', label: 'Cement', icon: TrendingUp },
  { id: 'concrete', label: 'Ready Mix Concrete', icon: TrendingUp },
  { id: 'bitumen', label: 'Bitumen & Asphalt', icon: TrendingUp },
  { id: 'aggregate', label: 'Aggregates', icon: TrendingUp },
  { id: 'sand', label: 'Sand', icon: TrendingUp },
  { id: 'masonry', label: 'Bricks & Blocks', icon: TrendingUp },
  { id: 'machinery', label: 'Equipment Rental', icon: TrendingUp },
  { id: 'labor', label: 'Labor Rates', icon: TrendingUp },
  { id: 'fuel', label: 'Fuel & Energy', icon: TrendingUp },
];

// ── Helper Functions ─────────────────────────────────────────────────────────

function formatRate(rate, unit) {
  if (rate >= 1000000) return `${(rate / 1000000).toFixed(2)}M`;
  if (rate >= 1000) return `${(rate / 1000).toFixed(1)}K`;
  return rate.toLocaleString();
}

function getCategoryBadgeColor(category) {
  const colors = {
    steel: 'bg-gray-100 text-gray-700 border-gray-300',
    cement: 'bg-blue-100 text-blue-700 border-blue-300',
    concrete: 'bg-sky-100 text-sky-700 border-sky-300',
    bitumen: 'bg-slate-100 text-slate-700 border-slate-300',
    aggregate: 'bg-stone-100 text-stone-700 border-stone-300',
    sand: 'bg-amber-100 text-amber-700 border-amber-300',
    masonry: 'bg-orange-100 text-orange-700 border-orange-300',
    machinery: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    labor: 'bg-green-100 text-green-700 border-green-300',
    professional: 'bg-purple-100 text-purple-700 border-purple-300',
    fuel: 'bg-red-100 text-red-700 border-red-300',
    energy: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    asphalt: 'bg-zinc-100 text-zinc-700 border-zinc-300',
    service: 'bg-teal-100 text-teal-700 border-teal-300',
  };
  return colors[category] || 'bg-gray-100 text-gray-700 border-gray-300';
}

// ── Material Rate Card ───────────────────────────────────────────────────────

function MaterialRateCard({ name, data, currency }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
            {data.brand && (
              <p className="text-xs text-gray-500 mt-0.5">Brand: {data.brand}</p>
            )}
          </div>
          <span className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold shrink-0',
            getCategoryBadgeColor(data.category)
          )}>
            {data.category}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-gray-900 tabular-nums">
            {currency} {formatRate(data.rate, data.unit)}
          </span>
          <span className="text-sm text-gray-500">/ {data.unit}</span>
        </div>

        {data.trend && (
          <div className="flex items-center gap-1.5 text-xs mb-3">
            {data.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-red-600" />}
            {data.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-green-600" />}
            {data.trend === 'stable' && <Minus className="h-3.5 w-3.5 text-gray-600" />}
            <span className={cn(
              'font-medium',
              data.trend === 'up' && 'text-red-600',
              data.trend === 'down' && 'text-green-600',
              data.trend === 'stable' && 'text-gray-600'
            )}>
              {data.trend === 'up' && `Up ${data.lastChange || ''}`}
              {data.trend === 'down' && `Down ${data.lastChange || ''}`}
              {data.trend === 'stable' && 'Stable'}
              {!data.trend && 'Current Rate'}
            </span>
          </div>
        )}

        {(data.minOrder || data.range || data.cityRange || data.notes) && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <Info className="h-3.5 w-3.5" />
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        )}

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
            {data.minOrder && (
              <p><span className="font-semibold">Min Order:</span> {data.minOrder} {data.unit}</p>
            )}
            {data.range && (
              <p><span className="font-semibold">Range:</span> {data.range}</p>
            )}
            {data.cityRange && (
              <p><span className="font-semibold">City Variation:</span> {data.cityRange}</p>
            )}
            {data.perKg && (
              <p><span className="font-semibold">Per Kg:</span> {currency} {data.perKg}</p>
            )}
            {data.hourly && (
              <p><span className="font-semibold">Hourly Rate:</span> {currency} {data.hourly.toLocaleString()}</p>
            )}
            {data.application && (
              <p><span className="font-semibold">Application:</span> {data.application}</p>
            )}
            {data.grade && (
              <p><span className="font-semibold">Grade:</span> {data.grade}</p>
            )}
            {data.skill && (
              <p><span className="font-semibold">Skill Level:</span> {data.skill}</p>
            )}
            {data.notes && (
              <p><span className="font-semibold">Notes:</span> {data.notes}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Rate Comparison Tool ─────────────────────────────────────────────────────

function RateComparisonTool({ materials, currency }) {
  const [boqRate, setBoqRate] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');

  const comparison = useMemo(() => {
    if (!boqRate || !selectedMaterial) return null;
    const material = materials.find(m => m.name === selectedMaterial);
    if (!material) return null;

    const boq = parseFloat(boqRate);
    const market = material.data.rate;
    const variance = market - boq;
    const variancePct = boq > 0 ? (variance / boq) * 100 : 0;

    let severity = 'OK';
    let severityColor = 'text-gray-700';
    let recommendation = 'Rate within acceptable range.';

    if (variancePct > 20) {
      severity = 'CRITICAL';
      severityColor = 'text-red-700';
      recommendation = 'Raise price escalation claim under PEC Clause 70 immediately.';
    } else if (variancePct > 10) {
      severity = 'WARNING';
      severityColor = 'text-amber-700';
      recommendation = 'Monitor closely — consider forward purchase or escalation notice.';
    } else if (variancePct < -10) {
      severity = 'FAVOURABLE';
      severityColor = 'text-green-700';
      recommendation = 'Market rate lower than BOQ. Verify quality and lock in purchase.';
    }

    return {
      material: material.name,
      boq,
      market,
      variance,
      variancePct: variancePct.toFixed(2),
      severity,
      severityColor,
      recommendation,
    };
  }, [boqRate, selectedMaterial, materials]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">BOQ Rate Comparison</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Select Material
          </label>
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          >
            <option value="">— Select Material —</option>
            {materials.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.data.unit})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            BOQ Estimated Rate ({currency})
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={boqRate}
            onChange={(e) => setBoqRate(e.target.value)}
            placeholder="Enter BOQ rate"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
      </div>

      {comparison && (
        <div className={cn(
          'rounded-xl border p-4 space-y-2',
          comparison.severity === 'CRITICAL' && 'border-red-200 bg-red-50',
          comparison.severity === 'WARNING' && 'border-amber-200 bg-amber-50',
          comparison.severity === 'FAVOURABLE' && 'border-green-200 bg-green-50',
          comparison.severity === 'OK' && 'border-gray-200 bg-gray-50'
        )}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">BOQ Rate:</span>
            <span className="text-sm font-bold tabular-nums text-gray-900">
              {currency} {comparison.boq.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Market Rate:</span>
            <span className="text-sm font-bold tabular-nums text-gray-900">
              {currency} {comparison.market.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-sm font-semibold text-gray-700">Variance:</span>
            <span className={cn('text-sm font-bold tabular-nums', comparison.severityColor)}>
              {comparison.variance >= 0 ? '+' : ''}{currency} {comparison.variance.toLocaleString()} ({comparison.variancePct}%)
            </span>
          </div>
          <div className="flex items-start gap-2 mt-3 pt-3 border-t">
            <Info className={cn('h-4 w-4 shrink-0 mt-0.5', comparison.severityColor)} />
            <p className={cn('text-xs', comparison.severityColor)}>
              <span className="font-semibold">{comparison.severity}:</span> {comparison.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function MaterialRateDashboard() {
  const { business } = useBusiness();
  const currency = business?.settings?.financials?.currency || 'PKR';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Convert rates object to array
  const allMaterials = useMemo(() => {
    return Object.entries(PK_CONSTRUCTION_MATERIAL_RATES_2026).map(([name, data]) => ({
      name,
      data,
    }));
  }, []);

  // Filter materials
  const filteredMaterials = useMemo(() => {
    return allMaterials.filter((material) => {
      const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.data.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || material.data.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allMaterials, searchQuery, selectedCategory]);

  const stats = useMemo(() => {
    const categories = new Set(allMaterials.map(m => m.data.category));
    return {
      total: allMaterials.length,
      categories: categories.size,
      avgRate: Math.round(allMaterials.reduce((sum, m) => sum + m.data.rate, 0) / allMaterials.length),
    };
  }, [allMaterials]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Material Rate Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Current market rates (Updated: August 2026)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 font-semibold text-blue-700">
            {stats.total} Materials
          </span>
          <span className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 font-semibold text-gray-700">
            {stats.categories} Categories
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">2026 Pakistani Market Rates</p>
            <p className="text-blue-700">
              Rates sourced from Pakistan Bureau of Statistics (PBS), brickpakistan.com, cementrate.pk, 
              and government-notified fuel prices (July 30, 2026). Updated quarterly with PEC Clause 70 indices.
            </p>
          </div>
        </div>
      </div>

      {/* Rate Comparison Tool */}
      <RateComparisonTool materials={allMaterials} currency={currency} />

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials..."
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
        </div>
        <div className="w-full sm:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          >
            {MATERIAL_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Material Cards Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center rounded-2xl border-2 border-dashed border-gray-200">
          <Search className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No materials found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMaterials.map((material) => (
            <MaterialRateCard
              key={material.name}
              name={material.name}
              data={material.data}
              currency={currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MaterialRateDashboard;
