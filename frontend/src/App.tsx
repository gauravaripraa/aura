/**
 * AURA - Smart Product Styler
 * AI-powered interior design visualization
 */

import { useState, useMemo } from 'react';
import { Sparkles, Package, Image, Search, Filter } from 'lucide-react';
import {
  Disclaimer,
  CategoryFilter,
  ProductGrid,
  SelectedProducts,
  StylePresets,
  GeneratedImage,
} from './components';
import { StyledRoomsGallery } from './components/StyledRoomsGallery';
import { useProducts, useSearchProducts, useGenerateStyle, useRegenerate } from './hooks';
import type { StylingPlan, Product } from './types';

type TabType = 'styler' | 'gallery';

function App() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('styler');
  
  // Filter mode state: 'dropdown' or 'search'
  const [filterMode, setFilterMode] = useState<'dropdown' | 'search'>('dropdown');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  
  // Filter state (dropdown mode)
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // Styling state
  const [mood, setMood] = useState('cozy');
  const [style, setStyle] = useState('modern');
  const [colorTheme, setColorTheme] = useState('neutral');
  const [roomType, setRoomType] = useState('living room');
  const [modelQuality, setModelQuality] = useState<'fast' | 'high'>('fast');
  const [customPrompt, setCustomPrompt] = useState('');

  // Generated image state
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [generatedImages, setGeneratedImages] = useState<Array<{ image_base64: string; viewpoint: string; response_text?: string }>>([]);
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

  const searchMutation = useSearchProducts();
  const generateMutation = useGenerateStyle();
  const regenerateMutation = useRegenerate();

  // Display products based on filter mode
  const displayProducts = useMemo(() => {
    if (filterMode === 'search' && searchResults.length > 0) {
      return searchResults;
    }
    return productsData?.products || [];
  }, [filterMode, searchResults, productsData?.products]);

  // Get selected products (check both dropdown and search results)
  const selectedProducts = useMemo(() => {
    const allProducts = [...(productsData?.products || []), ...searchResults];
    const uniqueProducts = allProducts.filter((p, index, self) => 
      index === self.findIndex(t => t.variation_id === p.variation_id)
    );
    return uniqueProducts.filter((p) => selectedIds.has(p.variation_id));
  }, [productsData?.products, searchResults, selectedIds]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const result = await searchMutation.mutateAsync(searchQuery);
      setSearchResults(result.products || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  console.log('App rendered with selectedIds:', Array.from(selectedIds), 'selectedProducts:', selectedProducts);
  // Toggle product selection
  const handleToggleProduct = (productId: string) => {
    const product = displayProducts.find(p => p.variation_id === productId);
    if (!product) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
        return next;
      });
      setSelectedProducts(prevProducts => 
        prevProducts.filter(p => p.variation_id !== productId)
      );
    } else {
      // Add product - need to find it in current filtered data
      const product = productsData?.products.find(p => p.variation_id === productId);
      if (!product) return;
      
      if (selectedIds.size < 4) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
        setSelectedProducts(prevProducts => {
          // Prevent duplicates
          if (prevProducts.some(p => p.variation_id === productId)) {
            return prevProducts;
          }
          return [...prevProducts, product];
        });
      }
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setSelectedProducts([]);
  };

  // Clear filters
  const handleClearFilters = () => {
    setCategory('');
    setColor('');
    setMinPrice(0);
    setMaxPrice(500);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Switch filter mode
  const handleSwitchMode = (mode: 'dropdown' | 'search') => {
    setFilterMode(mode);
    // Don't clear results when switching - let user keep selections
  };

  // Generate styled image
  const handleGenerate = async () => {
    if (selectedIds.size === 0) return;

    setGenerationError(undefined);
    setGeneratedImage(undefined);
    setGeneratedImages([]);

    try {
      const result = await generateMutation.mutateAsync({
        product_ids: Array.from(selectedIds),
        mood,
        style,
        color_theme: colorTheme,
        room_type: roomType,
        custom_prompt: customPrompt,
        model_quality: modelQuality,
      });

      if (result.success && (result.image_base64 || result.images)) {
        setGeneratedImage(result.image_base64);
        setGeneratedImages(result.images || []);
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

      if (result.success && (result.image_base64 || result.images)) {
        setGeneratedImage(result.image_base64);
        setGeneratedImages(result.images || []);
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
              <span className="relative tracking-wide">Styled Projects</span>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
              <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              Filter Products
            </h2>
            
            {/* Filter Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleSwitchMode('dropdown')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterMode === 'dropdown'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Filter size={16} />
                Filters
              </button>
              <button
                onClick={() => handleSwitchMode('search')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterMode === 'search'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Search size={16} />
                Search
              </button>
            </div>
          </div>

          {/* Dropdown Filters Mode */}
          {filterMode === 'dropdown' && (
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
          )}

          {/* Natural Language Search Mode */}
          {filterMode === 'search' && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Try: 'blue rugs under $50', 'cozy throws in cream', 'modern lighting'"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || searchMutation.isPending}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {searchMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      Search
                    </>
                  )}
                </button>
                {searchResults.length > 0 && (
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-3 text-gray-600 hover:text-gray-900 font-medium rounded-lg transition-colors border border-gray-300 hover:border-gray-400"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {/* Search results info */}
              {searchResults.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-medium">
                    {searchResults.length} results
                  </span>
                  <span>for "{searchQuery}"</span>
                </div>
              )}
              
              {/* Search tips */}
              {searchResults.length === 0 && !searchMutation.isPending && (
                <div className="mt-3 text-sm text-gray-500">
                  <p className="font-medium mb-1">💡 Search Tips:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                    <li>Describe what you're looking for naturally</li>
                    <li>Include colors, categories, or price ranges</li>
                    <li>Example: "warm toned rugs for living room"</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Selected Products - Always Visible */}
        <section>
          <SelectedProducts
            products={selectedProducts}
            onRemove={handleToggleProduct}
            onClear={handleClearSelection}
          />
        </section>

        {/* Section 2: Product Selection */}
        <section style={{height: '600px', overflowY: 'auto'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
              <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              Select Products (max 4)
            </h2>
            
            {/* Active filters/search display */}
            {filterMode === 'dropdown' && (category || color || minPrice > 0 || maxPrice < 500) && (
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
            {filterMode === 'search' && searchResults.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Search size={14} className="text-purple-600" />
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
                  {searchResults.length} results for "{searchQuery}"
                </span>
              </div>
            )}
          </div>
          
          {/* Product grid */}
          <ProductGrid
            products={displayProducts}
            selectedIds={selectedIds}
            onToggleProduct={handleToggleProduct}
            isLoading={filterMode === 'dropdown' ? isLoadingProducts : searchMutation.isPending}
            maxSelection={4}
          />
        </section>

        {/* Section 3: Styling Options */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
            Choose Styling Options
          </h2>
          <StylePresets
            mood={mood}
            style={style}
            colorTheme={colorTheme}
            roomType={roomType}
            modelQuality={modelQuality}
            customPrompt={customPrompt}
            onCustomPromptChange={setCustomPrompt}
            onMoodChange={setMood}
            onStyleChange={setStyle}
            onColorThemeChange={setColorTheme}
            onRoomTypeChange={setRoomType}
            onModelQualityChange={setModelQuality}
          />

          {/* Generate button */}
          <div className="mt-4">
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
            Generated Images
          </h2>
          <GeneratedImage
            imageBase64={generatedImage}
            images={generatedImages}
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
