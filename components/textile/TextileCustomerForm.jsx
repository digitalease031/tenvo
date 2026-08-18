'use client';

/**
 * Textile Wholesale Customer Form
 * Clean, focused form for adding parties (retailers/wholesalers/tailors)
 * Shows ONLY relevant fields for cloth wholesale business
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, X, Sparkles, AlertCircle, CheckCircle2, Store, Wallet, User, Phone, Mail, MapPin, UserCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTextilePaymentTerms, calculateDueDateFromTerms } from '@/lib/utils/textileWholesaleHelpers';

const BUYER_TYPES = [
  { value: 'Retailer', label: 'Retailer (Small Shop)' },
  { value: 'Wholesaler', label: 'Sub-Wholesaler' },
  { value: 'Tailor', label: 'Tailor / Stitching' },
  { value: 'Boutique', label: 'Boutique' },
];

const MARKET_LOCATIONS = [
  'Jama Cloth (Karachi)',
  'Lunda Bazaar (Karachi)',
  'Tariq Road (Karachi)',
  'Faisalabad Market',
  'Lahore Anarkali',
  'Multan Cloth Market',
  'Other',
];

const NTN_STATUS = [
  { value: 'none', label: 'Not Applicable' },
  { value: 'filer', label: 'Filer' },
  { value: 'non_filer', label: 'Non-Filer' },
];

export function TextileCustomerForm({
  onSave,
  onClose,
  initialData = null,
  category = 'textile-wholesale',
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    city: initialData?.city || 'Karachi',
    market_location: initialData?.market_location || '',
    credit_limit: initialData?.credit_limit || 0,
    opening_balance: initialData?.opening_balance || 0,
    payment_terms: initialData?.payment_terms || 'credit_30',
    domain_data: {
      shop_name: initialData?.domain_data?.shop_name || '',
      buyer_type: initialData?.domain_data?.buyer_type || 'Retailer',
      broker_name: initialData?.domain_data?.broker_name || '',
      ntn_status: initialData?.domain_data?.ntn_status || 'none',
      ...(initialData?.domain_data || {}),
    },
  });

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const handleDomainChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      domain_data: {
        ...prev.domain_data,
        [field]: value,
      },
    }));
  }, []);

  const handleFillDemo = () => {
    const demoNames = [
      'Zubair Fabrics & Sons',
      'Al-Rehman Cloth House',
      'Usman Textiles',
      'Bilal Wholesale',
      'Ahmed Trading Co.',
    ];
    const demoShops = [
      'Zubair Fabrics',
      'Al-Rehman Store',
      'Usman Cloth',
      'Bilal Traders',
      'Ahmed House',
    ];
    const demoBrokers = [
      'Haji Bashir',
      'Muneer Bhai',
      'Akram Sahab',
      'Rafiq Ahmed',
      'Salman Bhai',
    ];

    const randomIndex = Math.floor(Math.random() * demoNames.length);
    const randomPhone = '0' + (300 + Math.floor(Math.random() * 45)) + ' ' + Math.floor(Math.random() * 9000000 + 1000000);

    setFormData({
      name: demoNames[randomIndex],
      phone: randomPhone,
      email: 'contact@demo-party.com',
      address: `Shop # ${Math.floor(Math.random() * 90 + 10)}, ${MARKET_LOCATIONS[0]}`,
      city: 'Karachi',
      market_location: MARKET_LOCATIONS[0],
      credit_limit: [100000, 250000, 500000, 750000, 1000000][Math.floor(Math.random() * 5)],
      opening_balance: 0,
      payment_terms: 'credit_30',
      domain_data: {
        shop_name: demoShops[randomIndex],
        buyer_type: 'Retailer',
        broker_name: demoBrokers[randomIndex],
        ntn_status: 'filer',
      },
    });

    toast.success('Demo party data filled!');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Party name is required';
    }

    if (formData.credit_limit < 0) {
      newErrors.credit_limit = 'Cannot be negative';
    }

    if (formData.opening_balance < 0) {
      newErrors.opening_balance = 'Cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the highlighted errors');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        id: initialData?.id,
        name: formData.name.trim(),
        phone: formData.phone?.trim() || '',
        email: formData.email?.trim() || '',
        address: formData.address?.trim() || '',
        city: formData.city || 'Karachi',
        market_location: formData.market_location?.trim() || '',
        credit_limit: Number(formData.credit_limit) || 0,
        opening_balance: Number(formData.opening_balance) || 0,
        payment_terms: formData.payment_terms || 'cash',
        domain_data: {
          ...formData.domain_data,
          market_location: formData.market_location?.trim() || '',
          marketlocation: formData.market_location?.trim() || '',
        },
      };

      const result = await onSave(payload);

      if (result && !result.success) {
        toast.error(result.error || 'Failed to save party');
        return;
      }

      toast.success(initialData ? 'Party updated successfully' : 'Party added successfully');
      onClose?.();
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save party');
    } finally {
      setIsLoading(false);
    }
  };

  const creditUtilization = formData.credit_limit > 0 
    ? Math.min(100, ((formData.opening_balance || 0) / formData.credit_limit) * 100)
    : 0;

  return (
    <Card className="flex w-full max-w-4xl flex-col overflow-hidden border-wine/15 shadow-xl rounded-2xl max-h-[min(92vh,850px)]">
      {/* Header */}
      <CardHeader className="shrink-0 space-y-1 border-b border-wine/10 bg-wine/[0.03] px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-bold text-wine">
              <Users className="h-5 w-5 shrink-0" />
              {initialData ? 'Edit Party' : 'Add New Party'}
              {!initialData && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFillDemo}
                  className="h-7 px-2 text-[10px] font-semibold uppercase tracking-tight border-wine/20 text-wine hover:bg-wine/5"
                >
                  <Sparkles className="mr-1 h-3 w-3" /> Magic Fill
                </Button>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-wine/60">
              Add retailer, wholesaler, or tailor with credit limit
            </CardDescription>
          </div>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 shrink-0 rounded-lg hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Form Content */}
      <CardContent className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Party Name */}
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Party Name *
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Zubair Fabrics & Sons"
                  className={cn(
                    'h-11 text-[15px]',
                    errors.name && 'border-red-500 focus-visible:ring-red-500'
                  )}
                  autoFocus
                />
                {errors.name && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Shop Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" />
                  Shop Name
                </Label>
                <Input
                  value={formData.domain_data.shop_name}
                  onChange={(e) => handleDomainChange('shop_name', e.target.value)}
                  placeholder="e.g., Zubair Fabrics"
                  className="h-11 text-[15px]"
                />
              </div>

              {/* Buyer Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Buyer Type
                </Label>
                <Select
                  value={formData.domain_data.buyer_type}
                  onValueChange={(value) => handleDomainChange('buyer_type', value)}
                >
                  <SelectTrigger className="h-11 text-[15px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUYER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="0300 1234567"
                  className="h-11 text-[15px]"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contact@party.com"
                  className="h-11 text-[15px]"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Market Location */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Market Location
                </Label>
                <Select
                  value={formData.market_location}
                  onValueChange={(value) => handleInputChange('market_location', value)}
                >
                  <SelectTrigger className="h-11 text-[15px]">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKET_LOCATIONS.map((market) => (
                      <SelectItem key={market} value={market}>
                        {market}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  City
                </Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Karachi"
                  className="h-11 text-[15px]"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Address
                </Label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Shop #, Market, Area"
                  className="h-11 text-[15px]"
                />
              </div>
            </div>
          </div>

          {/* Credit & Financial */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Credit & Financial
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Credit Limit */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Credit Limit (PKR)
                </Label>
                <Input
                  type="number"
                  value={formData.credit_limit}
                  onChange={(e) => handleInputChange('credit_limit', e.target.value)}
                  placeholder="500000"
                  className={cn(
                    'h-11 text-[15px] tabular-nums',
                    errors.credit_limit && 'border-red-500'
                  )}
                />
                {errors.credit_limit && (
                  <p className="text-xs text-red-600">{errors.credit_limit}</p>
                )}
                {formData.credit_limit > 0 && (
                  <p className="text-xs text-gray-500">
                    Maximum outstanding balance allowed
                  </p>
                )}
              </div>

              {/* Opening Balance */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Opening Balance (PKR)
                </Label>
                <Input
                  type="number"
                  value={formData.opening_balance}
                  onChange={(e) => handleInputChange('opening_balance', e.target.value)}
                  placeholder="0"
                  className={cn(
                    'h-11 text-[15px] tabular-nums',
                    errors.opening_balance && 'border-red-500'
                  )}
                />
                {errors.opening_balance && (
                  <p className="text-xs text-red-600">{errors.opening_balance}</p>
                )}
              </div>

              {/* Credit Utilization Bar */}
              {formData.credit_limit > 0 && formData.opening_balance > 0 && (
                <div className="md:col-span-2 space-y-2 p-3 rounded-lg bg-gray-50 border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Credit Utilization</span>
                    <span className={cn(
                      'font-semibold tabular-nums',
                      creditUtilization > 80 ? 'text-rose-600' :
                      creditUtilization > 60 ? 'text-amber-600' :
                      'text-emerald-600'
                    )}>
                      {creditUtilization.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        creditUtilization > 80 ? 'bg-rose-500' :
                        creditUtilization > 60 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      )}
                      style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                    />
                  </div>
                  {creditUtilization > 80 && (
                    <p className="text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      High credit usage - approaching limit
                    </p>
                  )}
                </div>
              )}

              {/* Payment Terms */}
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Payment Terms
                </Label>
                <Select
                  value={formData.payment_terms}
                  onValueChange={(value) => handleInputChange('payment_terms', value)}
                >
                  <SelectTrigger className="h-11 text-[15px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getTextilePaymentTerms().map((term) => (
                      <SelectItem key={term.value} value={term.value}>
                        {term.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Additional Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Broker Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Broker / Agent Name
                </Label>
                <Input
                  value={formData.domain_data.broker_name}
                  onChange={(e) => handleDomainChange('broker_name', e.target.value)}
                  placeholder="e.g., Haji Bashir"
                  className="h-11 text-[15px]"
                />
                <p className="text-xs text-gray-500">
                  Optional - if using broker/commission agent
                </p>
              </div>

              {/* NTN Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  NTN Status (Tax)
                </Label>
                <Select
                  value={formData.domain_data.ntn_status}
                  onValueChange={(value) => handleDomainChange('ntn_status', value)}
                >
                  <SelectTrigger className="h-11 text-[15px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NTN_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Non-filers pay additional 3% tax
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            {formData.credit_limit > 0 ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Credit limit set: PKR {Number(formData.credit_limit).toLocaleString()}
              </span>
            ) : (
              <span className="text-gray-500">
                Cash customer (no credit limit)
              </span>
            )}
          </div>

          <div className="flex gap-3">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="px-6"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 bg-wine hover:bg-wine-dark"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {initialData ? 'Update Party' : 'Add Party'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default TextileCustomerForm;
