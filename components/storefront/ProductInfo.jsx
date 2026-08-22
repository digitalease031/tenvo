'use client';

import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { isAutoDealershipStore } from '@/lib/storefront/autoDealership';
import { isVehicleListingVertical } from '@/lib/utils/vehicleListingHelpers';
import { isAutoPartsFinderStore } from '@/lib/storefront/partsFinder';
import { isMarinePartsFinderStore } from '@/lib/storefront/marinePartsFinder';
import { isFashionEditorialStore } from '@/lib/storefront/fashionEditorial';
import { isPharmacyElevatedStore } from '@/lib/storefront/pharmacyStorefront';
import { isTyreElevatedStore } from '@/lib/storefront/tyreStorefront';
import { isElectronicsElevatedStore } from '@/lib/storefront/electronicsStorefront';
import { isFootwearElevatedStore } from '@/lib/storefront/footwearStorefront';
import { isEvBikesStore, formatEvProductSpecs } from '@/lib/storefront/evBikesStorefront';
import { resolvePharmacyProductMeta } from '@/lib/storefront/pharmacyProducts';
import { resolveSourcingBadge, buildElectronicsAttributeRows } from '@/lib/storefront/productAttributeChips';
import { ProductAttributeList } from '@/components/storefront/ProductAttributeList';
import { getStorefrontStockState } from '@/lib/storefront/storefrontStockUi';

export function ProductInfo({ product, businessDomain }) {
  const { currency, business } = useStorefront();

  const discountPercentage =
    product.compare_price && product.compare_price > product.price
      ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
      : null;

  const categoryKey = business?.category;
  const showPartsMeta = isAutoPartsFinderStore(categoryKey);
  const showMarineMeta = isMarinePartsFinderStore(categoryKey);
  const showFashionMeta = isFashionEditorialStore(categoryKey);
  const showTyreMeta = isTyreElevatedStore(categoryKey);
  const showElectronicsMeta = isElectronicsElevatedStore(categoryKey);
  const showFootwearMeta = isFootwearElevatedStore(categoryKey);
  const showEvMeta = isEvBikesStore(categoryKey);
  const showVehicleMeta =
    isAutoDealershipStore(categoryKey) ||
    isVehicleListingVertical(categoryKey) ||
    Boolean(
      product?.domain_data?.vehiclemake ||
        product?.domain_data?.modelyear ||
        product?.domain_data?.mileage ||
        product?.domain_data?.transmission
    );

  const pharmacyStore = isPharmacyElevatedStore(categoryKey);
  const pharmacyMeta = pharmacyStore ? resolvePharmacyProductMeta(product) : null;
  const evSpecs = showEvMeta ? formatEvProductSpecs(product) : [];

  const { stock: displayStock, isOutOfStock, isLowStock } = getStorefrontStockState(product);

  const sourcingBadge =
    showFashionMeta || showTyreMeta || showFootwearMeta ? resolveSourcingBadge(product.domain_data) : null;
  const electronicsWarranty = showElectronicsMeta
    ? buildElectronicsAttributeRows(product).find((row) => row.key === 'warranty')?.value
    : null;

  const vehicleYear = product?.domain_data?.modelyear || product?.domain_data?.year;
  const vehicleCondition = product?.domain_data?.condition;
  const vehicleTransmission = product?.domain_data?.transmission;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {product.category_name ? (
          <Badge variant="secondary" className="text-xs">
            {product.category_name}
          </Badge>
        ) : null}
        {product.is_featured ? (
          <Badge className="bg-amber-500 text-white text-xs">Featured</Badge>
        ) : null}
        {vehicleYear ? (
          <Badge variant="outline" className="text-xs border-blue-200 text-blue-800 bg-blue-50 font-semibold">
            {vehicleYear} Model
          </Badge>
        ) : null}
        {vehicleCondition ? (
          <Badge variant="secondary" className="text-xs capitalize">
            {String(vehicleCondition).replace(/_/g, ' ')}
          </Badge>
        ) : null}
        {vehicleTransmission ? (
          <Badge variant="outline" className="text-xs border-neutral-200 text-neutral-800 bg-neutral-50">
            {vehicleTransmission}
          </Badge>
        ) : null}
        {sourcingBadge === 'local' ? (
          <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-800 bg-emerald-50">
            Local
          </Badge>
        ) : null}
        {sourcingBadge === 'imported' ? (
          <Badge variant="secondary" className="text-xs">
            Imported
          </Badge>
        ) : null}
        {isOutOfStock ? (
          <Badge variant="destructive" className="text-xs">
            Out of Stock
          </Badge>
        ) : null}
        {isLowStock ? (
          <Badge variant="outline" className="text-xs border-amber-200 text-amber-800 bg-amber-50">
            Only {displayStock} left
          </Badge>
        ) : null}
        {pharmacyMeta?.requiresPrescription ? (
          <Badge className="bg-emerald-700 text-white text-xs">Prescription required</Badge>
        ) : null}
        {pharmacyMeta?.scheduleH ? (
          <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-800 bg-emerald-50">
            Schedule H
          </Badge>
        ) : null}
        {electronicsWarranty ? (
          <Badge variant="outline" className="text-xs border-blue-200 text-blue-800 bg-blue-50">
            {electronicsWarranty} warranty
          </Badge>
        ) : null}
        {evSpecs.map((spec) => (
          <Badge key={spec.id} variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50 font-semibold">
            {spec.label}: {spec.value}
          </Badge>
        ))}
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">{product.name}</h1>

      {pharmacyMeta?.genericName ? (
        <p className="text-sm text-slate-600">
          Generic: <span className="font-medium text-slate-800">{pharmacyMeta.genericName}</span>
        </p>
      ) : null}

      {product.rating ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating.toFixed(1)} ({product.review_count || 0} reviews)
          </span>
        </div>
      ) : null}

      <div className="flex items-baseline gap-3 tabular-nums">
        <span className="text-3xl font-semibold text-gray-900">
          {formatCurrency(product.price, currency)}
        </span>
        {discountPercentage ? (
          <>
            <span className="text-xl text-gray-400 line-through">
              {formatCurrency(product.compare_price, currency)}
            </span>
            <Badge variant="destructive" className="text-xs">
              Save {discountPercentage}%
            </Badge>
          </>
        ) : null}
      </div>

      {product.description ? (
        <p className="text-gray-600 leading-relaxed">{product.description}</p>
      ) : null}

      {(showVehicleMeta || showFashionMeta || showPartsMeta || showMarineMeta || showTyreMeta || showElectronicsMeta || showFootwearMeta || showEvMeta || product.sku) ? (
        <ProductAttributeList
          product={product}
          businessDomain={businessDomain}
          showVehicleMeta={showVehicleMeta}
          showFashionMeta={showFashionMeta}
          showPartsMeta={showPartsMeta}
          showMarineMeta={showMarineMeta}
          showTyreMeta={showTyreMeta}
          showElectronicsMeta={showElectronicsMeta}
          showFootwearMeta={showFootwearMeta}
          showEvMeta={showEvMeta}
          hideBadgeKeys={[
            ...(sourcingBadge ? ['sourcing'] : []),
            ...(electronicsWarranty ? ['warranty'] : []),
          ]}
        />
      ) : null}
    </div>
  );
}
