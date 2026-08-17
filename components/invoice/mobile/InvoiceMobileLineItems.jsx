'use client';

import React from 'react';
import { DomainMultiRowLineItems } from '@/components/invoice/DomainMultiRowLineItems';

/**
 * Mobile Line Items Proxy Component.
 * Forwards to DomainMultiRowLineItems to maintain full compatibility across mobile navigation.
 */
export function InvoiceMobileLineItems({
  items = [],
  products = [],
  category = 'retail-shop',
  currency = 'PKR',
  colors = { primary: '#10B981' },
  business = null,
  updateItem,
  removeItem,
  addItem,
  onScanBarcode,
  showTax = true,
  ...props
}) {
  return (
    <DomainMultiRowLineItems
      items={items}
      products={products}
      category={category}
      currency={currency}
      colors={colors}
      business={business}
      updateItem={updateItem}
      removeItem={removeItem}
      addItem={addItem}
      onScanBarcode={onScanBarcode}
      showTax={showTax}
      {...props}
    />
  );
}
