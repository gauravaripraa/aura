/**
 * Generated image display with feedback and regenerate
 */

import { useState } from 'react';
import { Download, RefreshCw, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import type { StylingPlan, GeneratedImageData } from '../types';

interface GeneratedImageProps {
  imageBase64?: string;
  images?: GeneratedImageData[];
  stylingPlan?: StylingPlan;
  isLoading: boolean;
  error?: string;
  skippedProducts?: string[];
  onRegenerate: (feedback: string) => void;
  isRegenerating: boolean;
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
}: GeneratedImageProps) => {
  const [feedback, setFeedback] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Use images array if available, otherwise fall back to single imageBase64
  const displayImages = images && images.length > 0 
    ? images 
    : imageBase64 
      ? [{ image_base64: imageBase64, viewpoint: 'Generated', response_text: undefined }]
      : [];

  const handleDownload = (index: number = selectedImageIndex) => {
    const img = displayImages[index];
    if (!img) return;
    
    try {
      // Convert base64 to blob for better browser compatibility
      const byteCharacters = atob(imageBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `styled-room-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. Please try again.');
    }
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

  const handleAddToGallery = () => {
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
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
      {/* Success message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border-b border-green-200 p-3 flex items-start gap-2">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">
            Added to styled gallery successfully
          </p>
        </div>
      )}

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
        
        {/* Action buttons overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleAddToGallery}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors shadow-md"
            title="Add to styled gallery"
          >
            <Plus size={20} />
            <span className="text-sm font-medium">Add to Styled Gallery</span>
          </button>
          <button
            onClick={handleDownload}
            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
            title="Download image"
          >
            <Download size={20} />
          </button>
        </div>
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
    </div>
  );
};
