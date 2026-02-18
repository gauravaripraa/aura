/**
 * Selected products panel with styling options
 */

import { X, Sparkles } from 'lucide-react';
import type { Product } from '../types';

interface SelectedProductsProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
}

export const SelectedProducts = ({ products, onRemove, onClear }: SelectedProductsProps) => {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles size={20} className="text-purple-600" />
          Selected Products ({products.length}/5)
        </h3>
        <button
          onClick={onClear}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {products.map((product) => {
          const imageUrl = product.image_url;

          return (
            <div
              key={product.variation_id}
              className="relative group bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200"
            >
              <div className="w-20 h-20">
                <img
                  src={imageUrl}
                  alt={product.ITEM_NAME}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                  }}
                />
              </div>
              <button
                onClick={() => onRemove(product.variation_id)}
                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X size={12} className="text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-1 py-0.5">
                <p className="text-[10px] text-gray-900 truncate">{product.ITEM_NAME}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
