'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { getPartnerShowcaseData } from '@/lib/actions/partner/showcase';
import { TenvoTextLogo } from '@/components/branding/TenvoTextLogo';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import {
  ShieldCheck,
  Store,
  Copy,
  CheckCircle2,
  Loader2,
  Share2,
  ArrowRight,
  Award,
  Compass,
  Building2,
  Layers,
} from 'lucide-react';
import { persistBusinessShell } from '@/lib/utils/businessClientCache';

export default function PartnerShowcasePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const res = await getPartnerShowcaseData();
        if (res.success) {
          setData(res.data);
        } else {
          toast.error(res.error || 'Could not load Partner Showcase data');
        }
      } catch (err) {
        console.error('Partner Showcase load error:', err);
        toast.error('Failed to load showcase data');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      router.push('/login?next=/partner');
    }
  }, [user, authLoading, router]);

  const handleCopyLink = (code) => {
    if (!code) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tenvo.app';
    const link = `${origin}/register?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLaunchDemo = (domain) => {
    if (!domain) return;
    persistBusinessShell({ domain, business_name: `Demo (${domain})` }, 'manager');
    router.push(`/business/${domain}`);
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-wine" />
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 animate-pulse">
            Loading Partner Showcase...
          </p>
        </div>
      </div>
    );
  }

  const affiliate = data?.affiliate;
  const referralCode = affiliate?.referralCode || 'PARTNER';
  const verticalDemos = data?.verticalDemos || [];

  const filteredDemos = activeCategory === 'all'
    ? verticalDemos
    : verticalDemos.filter(v => v.packageKey === activeCategory || v.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TenvoTextLogo />
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-wine/10 border border-wine/20 text-wine text-[10px] font-bold uppercase tracking-wider">
                Partner Hub
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/affiliates/status')}
                className="text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg h-8"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/multi-business')}
                className="text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg h-8"
              >
                My Workspaces
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/')}
                className="text-xs font-semibold text-gray-700 border-gray-200 rounded-lg h-8 bg-white shadow-xs hover:bg-gray-50"
              >
                Public Store
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Compact Light-Themed Hero Card */}
        <div className="bg-gradient-to-r from-wine/[0.06] via-wine/[0.02] to-white rounded-2xl p-6 sm:p-8 border border-wine/15 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-wine/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-wine/10 border border-wine/20 text-wine text-[10px] font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              Affiliate &amp; Demo Showcase
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
              Market Tenvo.{' '}
              <span className="text-wine">Showcase Live Vertical Demos.</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed max-w-2xl">
              Present fully functioning enterprise workspaces, POS terminals, and domain-specific themes to prospective clients with zero risk to production data.
            </p>
          </div>
        </div>

        {/* Affiliate Link & Key Stats Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-wine" />
                Your Affiliate Partner Link
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Share your referral link with clients to track conversions and earn lifetime commissions.
              </p>
            </div>

            {/* Referral Link Box */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-1.5 rounded-xl w-full md:w-auto">
              <code className="text-xs font-mono font-semibold text-gray-800 px-3 py-1 bg-white rounded-lg border border-gray-200 truncate max-w-xs select-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : `https://tenvo.app/register?ref=${referralCode}`}
              </code>
              <Button
                onClick={() => handleCopyLink(referralCode)}
                className="bg-wine hover:bg-wine/90 text-white text-xs font-semibold px-3.5 rounded-lg flex items-center gap-1.5 shrink-0 h-8 shadow-xs"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-0.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Referral Code</p>
              <p className="text-base font-bold text-gray-900 font-mono">{referralCode}</p>
            </div>
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-0.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Commission Rate</p>
              <p className="text-base font-bold text-wine tabular-nums">{affiliate?.commissionRate || 20}%</p>
            </div>
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-0.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Referrals</p>
              <p className="text-base font-bold text-gray-900 tabular-nums">{data?.referralCount || 0}</p>
            </div>
            <div className="p-3.5 bg-emerald-50/90 border border-emerald-200/80 rounded-xl space-y-0.5">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Earnings</p>
              <p className="text-base font-bold text-emerald-800 tabular-nums">PKR {(affiliate?.totalEarnings || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Vertical Demo Showcase Header & Filter Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-wine" />
                Industry Vertical Demo Hubs
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Select any industry domain below to present a live, fully populated working demo to your clients.
              </p>
            </div>
          </div>

          {/* Categories Horizontal Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-wine text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Verticals ({verticalDemos.length})
            </button>
            {verticalDemos.map((item) => (
              <button
                key={item.packageKey}
                onClick={() => setActiveCategory(item.packageKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeCategory === item.packageKey
                    ? 'bg-wine text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDemos.map((demo) => {
            const hasStores = demo.matchingStores && demo.matchingStores.length > 0;
            const primaryStore = hasStores ? demo.matchingStores[0] : null;
            const targetDomain = primaryStore?.domain || demo.demoStoreDomain || `demo-${demo.packageKey}`;

            return (
              <div
                key={demo.packageKey}
                className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between hover:border-wine/30 hover:shadow-md transition-all duration-200 group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-wine/10 text-wine rounded-xl flex items-center justify-center font-bold">
                      <Store className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-wine/5 border border-wine/15 text-[10px] font-bold text-wine uppercase tracking-wider">
                      {demo.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-wine transition-colors">
                      {demo.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1 line-clamp-2">
                      {demo.description}
                    </p>
                  </div>

                  <div className="pt-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      {hasStores ? 'Available Demo Instances:' : 'Target Demo Environment:'}
                    </p>
                    <div className="space-y-1">
                      {hasStores ? (
                        demo.matchingStores.slice(0, 2).map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs font-medium text-gray-800">
                            <span className="truncate">{s.name}</span>
                            <span className="text-[10px] font-mono text-wine font-semibold">{s.domain}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between p-2 bg-gray-50/70 border border-gray-100 rounded-lg text-xs font-medium text-gray-600">
                          <span className="truncate">Standard Vertical Sandbox</span>
                          <span className="text-[10px] font-mono text-wine font-semibold">{targetDomain}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-gray-100">
                  <Button
                    onClick={() => handleLaunchDemo(targetDomain)}
                    className="w-full bg-wine hover:bg-wine/90 text-white font-semibold text-xs rounded-xl h-10 uppercase tracking-wider shadow-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Launch Demo Presentation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Tenancy Guarantee Banner */}
        <div className="bg-gradient-to-r from-emerald-50/90 via-white to-gray-50 rounded-2xl p-5 sm:p-6 border border-emerald-200/80 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Isolated Partner Demo Environment
            </div>
            <h3 className="text-base font-bold text-gray-900">
              Complete Client Privacy &amp; Production Data Protection
            </h3>
            <p className="text-xs text-gray-600 font-medium max-w-2xl leading-relaxed">
              Partner sessions are strictly scoped to registered Demo Stores. Your access prevents viewing private client businesses, super-admin platform controls, or owner account metrics.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push('/multi-business')}
            className="border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold uppercase tracking-wider px-4 rounded-xl shrink-0 transition-colors h-10 shadow-xs"
          >
            Go to Workspace Hub
          </Button>
        </div>
      </div>
    </div>
  );
}
