/**
 * AURA - Smart Product Styler
 * AI-powered interior design visualization
 */

import { useState, useMemo } from 'react';
import { Sparkles, Package, Image } from 'lucide-react';
import {
  Disclaimer,
  CategoryFilter,
  ProductGrid,
  SelectedProducts,
  GeneratedImage,
} from './components';
import { StyledRoomsGallery } from './components/StyledRoomsGallery';
import { useProducts, useGenerateStyle, useRegenerate } from './hooks';
import type { Product, StylingPlan } from './types';

type TabType = 'styler' | 'gallery';

function App() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('styler');
  
  // Filter state
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Model quality state
  const [modelQuality, setModelQuality] = useState<'fast' | 'high'>('fast');

  // Generated image state
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [stylingPlan, setStylingPlan] = useState<StylingPlan | undefined>();
  const [skippedProducts, setSkippedProducts] = useState<string[]>([]);
  const [generationError, setGenerationError] = useState<string | undefined>();

  // Queries and mutations
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({
    category: category || undefined,
    color: color || undefined,
    min_price: minPrice > 0 ? minPrice : undefined,
    max_price: maxPrice < 500 ? maxPrice : undefined,
  });

  const generateMutation = useGenerateStyle();
  const regenerateMutation = useRegenerate();

  // Get selected products
  const selectedProducts = useMemo(() => {
    if (!productsData?.products) return [];
    return productsData.products.filter((p) => selectedIds.has(p.variation_id));
  }, [productsData?.products, selectedIds]);

  // Toggle product selection
  const handleToggleProduct = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else if (next.size < 5) {
        next.add(productId);
      }
      return next;
    });
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Clear filters
  const handleClearFilters = () => {
    setCategory('');
    setColor('');
    setMinPrice(0);
    setMaxPrice(500);
  };

  // Generate styled image
  const handleGenerate = async () => {
    if (selectedIds.size === 0) return;

    setGenerationError(undefined);
    setGeneratedImage(undefined);

    try {
      const result = await generateMutation.mutateAsync({
        product_ids: Array.from(selectedIds),
        model_quality: modelQuality,
      });

      if (result.success && result.image_base64) {
        setGeneratedImage(result.image_base64);
        setStylingPlan(result.styling_plan);
        setSkippedProducts(result.skipped_products || []);
      } else {
        setGenerationError(result.error || 'Failed to generate image');
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Regenerate with feedback
  const handleRegenerate = async (feedback: string) => {
    if (!stylingPlan) return;

    setGenerationError(undefined);

    try {
      const result = await regenerateMutation.mutateAsync({
        product_ids: Array.from(selectedIds),
        previous_plan: stylingPlan,
        feedback,
        model_quality: modelQuality,
      });

      if (result.success && result.image_base64) {
        setGeneratedImage(result.image_base64);
        setStylingPlan(result.styling_plan);
        setSkippedProducts(result.skipped_products || []);
      } else {
        setGenerationError(result.error || 'Failed to regenerate image');
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-50 via-white to-purple-50 border-b border-purple-100 shadow-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-lg opacity-30 rounded-full"></div>
                <Sparkles size={40} className="relative text-purple-600 animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 bg-clip-text text-transparent tracking-tight">
                  AURA
                </h1>
                <p className="text-sm font-medium text-gray-600 tracking-wide mt-0.5">
                  ✨ AI-powered interior design visualization
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <Package size={18} className="text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Smart Product Styler</span>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-3 pt-4 -mb-px">
            <button
              onClick={() => setActiveTab('styler')}
              className={`group relative flex items-center gap-3 px-8 py-4 font-bold text-base transition-all duration-300 rounded-t-2xl ${
                activeTab === 'styler'
                  ? 'bg-white text-purple-600 shadow-lg transform translate-y-0.5'
                  : 'bg-gradient-to-b from-white/80 to-white/40 text-gray-600 hover:text-purple-500 hover:shadow-md hover:scale-105'
              }`}
            >
              {activeTab === 'styler' && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-2xl"></div>
              )}
              <div className={`relative ${activeTab === 'styler' ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'}`}>
                <Sparkles size={20} className={activeTab === 'styler' ? 'text-purple-600' : 'text-gray-500 group-hover:text-purple-500'} />
              </div>
              <span className="relative tracking-wide">Product Styler</span>
              {activeTab === 'styler' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`group relative flex items-center gap-3 px-8 py-4 font-bold text-base transition-all duration-300 rounded-t-2xl ${
                activeTab === 'gallery'
                  ? 'bg-white text-purple-600 shadow-lg transform translate-y-0.5'
                  : 'bg-gradient-to-b from-white/80 to-white/40 text-gray-600 hover:text-purple-500 hover:shadow-md hover:scale-105'
              }`}
            >
              {activeTab === 'gallery' && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-2xl"></div>
              )}
              <div className={`relative ${activeTab === 'gallery' ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`}>
                <Image size={20} className={activeTab === 'gallery' ? 'text-purple-600' : 'text-gray-500 group-hover:text-purple-500'} />
              </div>
              <span className="relative tracking-wide">Styled Room Gallery</span>
              {activeTab === 'gallery' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-full"></div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      {activeTab === 'gallery' ? (
        <StyledRoomsGallery />
      ) : (
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Disclaimer */}
        <Disclaimer />

        {/* Section 1: Filters */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
            Filter Products
          </h2>
          <CategoryFilter
            selectedCategory={category}
            selectedColor={color}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onCategoryChange={setCategory}
            onColorChange={setColor}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onClear={handleClearFilters}
          />
        </section>

        {/* Section 2: Product Selection */}
        <section style={{height: '600px', overflowY: 'auto'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
              <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              Select Products (max 5)
            </h2>
            
            {/* Active filters display */}
            {(category || color || minPrice > 0 || maxPrice < 500) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Active filters:</span>
                {category && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
                    {category}
                  </span>
                )}
                {color && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
                    {color}
                  </span>
                )}
                {(minPrice > 0 || maxPrice < 500) && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
                    ${minPrice} - ${maxPrice}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Selected products panel */}
          <div className="mb-4">
            <SelectedProducts
              products={selectedProducts}
              onRemove={handleToggleProduct}
              onClear={handleClearSelection}
            />
          </div>

          {/* Product grid */}
          <ProductGrid
            products={productsData?.products || []}
            selectedIds={selectedIds}
            onToggleProduct={handleToggleProduct}
            isLoading={isLoadingProducts}
            maxSelection={5}
          />
        </section>

        {/* Section 3: Generate Image */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
            Generate Styled Image
          </h2>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            {/* Model quality toggle */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-gray-700">Quality:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setModelQuality('fast')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    modelQuality === 'fast'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Fast
                </button>
                <button
                  onClick={() => setModelQuality('high')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    modelQuality === 'high'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  High Quality
                </button>
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={selectedIds.size === 0 || generateMutation.isPending}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles size={20} />
              {generateMutation.isPending ? 'Generating...' : 'Generate Styled Image'}
            </button>
            {selectedIds.size === 0 && (
              <p className="text-sm text-gray-600 mt-2">Select at least one product to generate</p>
            )}
          </div>
        </section>

        {/* Section 4: Generated Image */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
            Generated Image
          </h2>
          <GeneratedImage
            imageBase64={generatedImage}
            stylingPlan={stylingPlan}
            isLoading={generateMutation.isPending}
            error={generationError}
            skippedProducts={skippedProducts}
            onRegenerate={handleRegenerate}
            isRegenerating={regenerateMutation.isPending}
          />
        </section>
      </main>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          <p>Smart Product Styler MVP • Built with Google Vertex AI, ADK, and Gemini</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
