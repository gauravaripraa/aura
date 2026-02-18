/**
 * Generated image display with feedback and regenerate
 */

import { useState } from 'react';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import type { StylingPlan } from '../types';

interface GeneratedImageProps {
  imageBase64?: string;
  stylingPlan?: StylingPlan;
  isLoading: boolean;
  error?: string;
  skippedProducts?: string[];
  onRegenerate: (feedback: string) => void;
  isRegenerating: boolean;
}

export const GeneratedImage = ({
  imageBase64,
  stylingPlan,
  isLoading,
  error,
  skippedProducts,
  onRegenerate,
  isRegenerating,
}: GeneratedImageProps) => {
  const [feedback, setFeedback] = useState('');

  const handleDownload = () => {
    if (!imageBase64) return;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageBase64}`;
    link.download = 'styled-room.png';
    link.click();
  };

  const handleRegenerate = () => {
    if (feedback.trim()) {
      onRegenerate(feedback);
      setFeedback('');
    }
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

  if (!imageBase64) {
    return (
      <div className="bg-white rounded-lg p-8 text-center min-h-[400px] flex flex-col items-center justify-center border border-gray-200 shadow-sm">
        <div className="text-gray-500">
          <p className="text-lg mb-2">No image generated yet</p>
          <p className="text-sm">Select products and click "Generate Style" to create a styled image</p>
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

      {/* Generated image */}
      <div className="relative">
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt="Generated styled room"
          className="w-full h-auto"
        />
        
        {/* Download button overlay */}
        <button
          onClick={handleDownload}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
          title="Download image"
        >
          <Download size={20} />
        </button>
      </div>

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
