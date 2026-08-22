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
  LayoutGrid
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
      <div className="flex h-screen w-full items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-wine" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-pulse">
            Initializing Partner Showcase...
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
    <div className="min-h-screen bg-canvas text-foreground pb-20">
      {/* Top Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <TenvoTextLogo />
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-wine/10 border border-wine/20 text-wine text-[10px] font-semibold uppercase tracking-wider">
                Partner Portal
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                onClick={() => router.push('/affiliates/status')}
                className="text-xs font-semibold uppercase tracking-wider hover:bg-muted rounded-xl"
              >
                Partner Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/multi-business')}
                className="text-xs font-semibold uppercase tracking-wider hover:bg-muted rounded-xl"
              >
                My Entities
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="text-xs font-semibold uppercase tracking-wider border-border rounded-xl"
              >
                Public Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-wine-950 via-wine-900 to-zinc-950 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-wine-800/40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-[10px] font-semibold uppercase tracking-widest">
              <Award className="w-3.5 h-3.5" />
              Affiliate & Sales Demo Hub
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Market Tenvo.<br />
              <span className="text-amber-300 drop-shadow-sm">Showcase Live Vertical Demos.</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-100 font-medium leading-relaxed max-w-2xl">
              Present fully functioning enterprise workspaces, POS terminals, and domain-specific themes to prospective clients with zero risk to production data.
            </p>
          </div>
        </div>

        {/* Partner Referral Link & Earnings Card */}
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Share2 className="w-5 h-5 text-wine" />
                Your Affiliate Partner Link
              </h2>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Share your referral link with clients to track conversions and earn lifetime commissions.
              </p>
            </div>

            {/* Referral Link Box */}
            <div className="flex items-center gap-2 bg-muted/60 border border-border p-2 rounded-xl w-full md:w-auto">
              <code className="text-xs font-mono font-semibold text-foreground px-3 py-1.5 bg-background rounded-lg border border-border truncate max-w-xs">
                {typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : `https://tenvo.app/register?ref=${referralCode}`}
              </code>
              <Button
                onClick={() => handleCopyLink(referralCode)}
                className="bg-wine hover:bg-wine-700 text-white text-xs font-semibold px-4 rounded-lg flex items-center gap-1.5 flex-shrink-0 h-9"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Referral Code</p>
              <p className="text-lg font-bold text-foreground font-mono">{referralCode}</p>
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Commission Rate</p>
              <p className="text-lg font-bold text-wine">{affiliate?.commissionRate || 20}%</p>
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Active Referrals</p>
              <p className="text-lg font-bold text-foreground">{data?.referralCount || 0}</p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
              <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Earnings</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">PKR {(affiliate?.totalEarnings || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Vertical Demo Showcase Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <Compass className="w-6 h-6 text-wine" />
                Industry Vertical Demo Hubs
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                Select any industry domain below to present a live, fully populated working demo to your clients.
              </p>
            </div>
          </div>

          {/* Categories Horizontal Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-wine text-white shadow-md shadow-wine/20'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              All Verticals ({verticalDemos.length})
            </button>
            {verticalDemos.map((item) => (
              <button
                key={item.packageKey}
                onClick={() => setActiveCategory(item.packageKey)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeCategory === item.packageKey
                    ? 'bg-wine text-white shadow-md shadow-wine/20'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDemos.map((demo) => {
            const hasStores = demo.matchingStores && demo.matchingStores.length > 0;
            const primaryStore = hasStores ? demo.matchingStores[0] : null;
            const targetDomain = primaryStore?.domain || demo.demoStoreDomain || `demo-${demo.packageKey}`;

            return (
              <div
                key={demo.packageKey}
                className="bg-card text-card-foreground rounded-2xl border border-border p-6 flex flex-col justify-between hover:shadow-xl hover:border-wine/40 transition-all duration-300 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-wine/10 text-wine rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Store className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-muted border border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {demo.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-wine transition-colors">
                      {demo.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1 line-clamp-2">
                      {demo.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {hasStores ? 'Available Demo Instances:' : 'Target Demo Environment:'}
                    </p>
                    <div className="space-y-1.5">
                      {hasStores ? (
                        demo.matchingStores.slice(0, 2).map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-2 bg-muted/60 rounded-lg text-xs font-medium text-foreground">
                            <span className="truncate">{s.name}</span>
                            <span className="text-[10px] font-mono text-wine font-semibold">{s.domain}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between p-2 bg-muted/40 border border-border rounded-lg text-xs font-medium text-muted-foreground">
                          <span className="truncate">Standard Vertical Sandbox</span>
                          <span className="text-[10px] font-mono text-wine font-semibold">{targetDomain}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    onClick={() => handleLaunchDemo(targetDomain)}
                    className="w-full bg-wine hover:bg-wine-700 text-white font-semibold text-xs rounded-xl h-11 uppercase tracking-wider shadow-md flex items-center justify-center gap-2 group-hover:shadow-lg transition-all"
                  >
                    <span>Launch Demo Presentation</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Tenancy Guarantee Banner */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-black text-white rounded-2xl p-6 sm:p-8 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Isolated Partner Demo Environment
            </div>
            <h3 className="text-lg font-semibold text-white">
              Complete Client Privacy & Production Data Protection
            </h3>
            <p className="text-xs text-zinc-300 font-medium max-w-2xl leading-relaxed">
              Partner sessions are strictly scoped to registered Demo Stores. Your access prevents viewing private client businesses, super-admin platform controls, or owner account metrics.
            </p>
          </div>

          <button
            onClick={() => router.push('/multi-business')}
            className="border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold uppercase tracking-wider px-6 py-2.5 rounded-xl flex-shrink-0 transition-colors h-11"
          >
            Go to Entity Hub
          </button>
        </div>
      </div>
    </div>
  );
}
