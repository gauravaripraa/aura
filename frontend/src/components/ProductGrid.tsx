/**
 * Product grid with multi-select capability
 */

import { ProductCard } from './ProductCard';
import { LoadingSpinner } from './LoadingSpinner';
import type { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  selectedIds: Set<string>;
  onToggleProduct: (productId: string) => void;
  isLoading?: boolean;
  maxSelection?: number;
}

export const ProductGrid = ({
  products,
  selectedIds,
  onToggleProduct,
  isLoading,
  maxSelection = 5,
}: ProductGridProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Loading products..." />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
        <p className="text-sm text-gray-600 mb-4">
          This filter combination doesn't match any products.<br />
          Try selecting different filters or clear all filters to see more options.
        </p>
      </div>
    );
  }

  const isMaxSelected = selectedIds.size >= maxSelection;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.variation_id}
          product={product}
          isSelected={selectedIds.has(product.variation_id)}
          onToggle={onToggleProduct}
          disabled={isMaxSelected && !selectedIds.has(product.variation_id)}
        />
      ))}
    </div>
  );
};
