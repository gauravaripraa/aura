/**
 * Generated image display with feedback and regenerate
 */

import { useState } from 'react';
import { Download, RefreshCw, AlertCircle, CheckCircle, Plus, ShoppingBag, X, Check } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import type { StylingPlan, GeneratedImageData, Product } from '../types';

interface GeneratedImageProps {
  imageBase64?: string;
  images?: GeneratedImageData[];
  stylingPlan?: StylingPlan;
  isLoading: boolean;
  error?: string;
  skippedProducts?: string[];
  onRegenerate: (feedback: string) => void;
  isRegenerating: boolean;
  selectedProducts?: Product[];
}

export const GeneratedImage = ({
  imageBase64,
  images,
  stylingPlan,
  isLoading,
  error,
  skippedProducts,
  onRegenerate,
  isRegenerating,
  selectedProducts = [],
}: GeneratedImageProps) => {
  const [feedback, setFeedback] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showShopModal, setShowShopModal] = useState(false);

  // Use images array if available, otherwise fall back to single imageBase64
  const displayImages = images && images.length > 0 
    ? images 
    : imageBase64 
      ? [{ image_base64: imageBase64, viewpoint: 'Generated', response_text: undefined }]
      : [];

  const handleDownload = (index: number = selectedImageIndex) => {
    const img = displayImages[index];
    if (!img) return;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${img.image_base64}`;
    link.download = `styled-room-${index + 1}.png`;
    link.click();
  };

  const handleDownloadAll = () => {
    displayImages.forEach((_, index) => {
      setTimeout(() => handleDownload(index), index * 500);
    });
  };

  const handleRegenerate = () => {
    if (feedback.trim()) {
      onRegenerate(feedback);
      setFeedback('');
    }
  };

  // Add to Gallery - shows success toast
  const handleAddToGallery = () => {
    setToastMessage('Successfully added to your gallery!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Shop the Look - shows modal with products
  const handleShopTheLook = () => {
    setShowShopModal(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px] border border-gray-200 shadow-sm">
        <LoadingSpinner size={48} text="Generating your styled image..." />
        <p className="text-gray-600 text-sm mt-4">This may take a moment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-8 border border-red-200 shadow-sm">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle size={24} />
          <span className="font-medium">Generation Failed</span>
        </div>
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  if (!imageBase64 && displayImages.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center min-h-[400px] flex flex-col items-center justify-center border border-gray-200 shadow-sm">
        <div className="text-gray-500">
          <p className="text-lg mb-2">No image generated yet</p>
          <p className="text-sm">Select products and click "Generate Style" to create styled images</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {/* Skipped products warning */}
      {skippedProducts && skippedProducts.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            Some products were skipped due to image loading issues: {skippedProducts.join(', ')}
          </p>
        </div>
      )}

      {/* Image count badge */}
      {displayImages.length > 1 && (
        <div className="bg-purple-50 border-b border-purple-200 p-3 flex items-center justify-between">
          <span className="text-sm text-purple-700 font-medium">
            {displayImages.length} images generated
          </span>
          <button
            onClick={handleDownloadAll}
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <Download size={14} />
            Download All
          </button>
        </div>
      )}

      {/* Image thumbnails for selection */}
      {displayImages.length > 1 && (
        <div className="p-3 border-b border-gray-200 flex gap-2 overflow-x-auto">
          {displayImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImageIndex === index 
                  ? 'border-purple-500 ring-2 ring-purple-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={`data:image/png;base64,${img.image_base64}`}
                alt={`View ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main generated image */}
      <div className="relative">
        <img
          src={`data:image/png;base64,${displayImages[selectedImageIndex]?.image_base64}`}
          alt="Generated styled room"
          className="w-full h-auto"
        />
        
        {/* Download button overlay */}
        <button
          onClick={() => handleDownload(selectedImageIndex)}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
          title="Download image"
        >
          <Download size={20} />
        </button>

        {/* Image index indicator */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedImageIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Styling info */}
      {stylingPlan && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Style Applied</span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{stylingPlan.scene_description}</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
              {stylingPlan.styling_parameters.mood}
            </span>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
              {stylingPlan.styling_parameters.style}
            </span>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
              {stylingPlan.styling_parameters.color_theme}
            </span>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
              {stylingPlan.styling_parameters.room_type}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {displayImages.length > 0 && (
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleAddToGallery}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm font-medium"
          >
            <Plus size={18} />
            Add to Gallery
          </button>
          <button
            onClick={handleShopTheLook}
            disabled={selectedProducts.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-sm font-medium"
          >
            <ShoppingBag size={18} />
            Shop the Look ({selectedProducts.length})
          </button>
        </div>
      )}

      {/* Feedback and regenerate */}
      <div className="p-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Refine with Feedback
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g., 'make it brighter', 'add more plants', 'warmer lighting'"
            className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleRegenerate}
            disabled={!feedback.trim() || isRegenerating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <Check size={20} />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Shop the Look Modal */}
      {showShopModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShopModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative">
              {displayImages[selectedImageIndex] && (
                <img 
                  src={`data:image/png;base64,${displayImages[selectedImageIndex].image_base64}`}
                  alt="Styled Room"
                  className="w-full h-48 object-cover rounded-t-2xl"
                />
              )}
              <button 
                onClick={() => setShowShopModal(false)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h2 className="text-2xl font-bold text-white">Shop the Look</h2>
                <p className="text-white/80 text-sm">{selectedProducts.length} products in this styled room</p>
              </div>
            </div>

            {/* Modal Content - Products Grid */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-purple-600" />
                  Featured Products
                </h3>
              </div>
              
              {selectedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedProducts.map((product) => (
                    <div 
                      key={product.variation_id} 
                      className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow border border-gray-200"
                    >
                      <div className="relative h-40 bg-white">
                        <img
                          src={product.image_url}
                          alt={product.ITEM_NAME}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200/f3f4f6/9ca3af?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                          {product.ITEM_NAME}
                        </h4>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-purple-600">
                            ${product.PRICE?.toFixed(2) || '0.00'}
                          </span>
                          {product.COLOR && (
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                              {product.COLOR}
                            </span>
                          )}
                        </div>
                        {product.CLASS_DESCRIPTION && (
                          <p className="text-xs text-gray-600 truncate mb-2">
                            {product.CLASS_DESCRIPTION}
                          </p>
                        )}
                        {product.dimensions && (
                          <p className="text-xs text-gray-500">
                            {product.dimensions}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No products available</p>
                </div>
              )}

              {/* Close button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowShopModal(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
