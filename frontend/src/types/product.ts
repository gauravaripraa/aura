/**
 * Product types matching the backend data structure
 * Updated for new schema with dimensions, image_url, and alt_image_urls
 */

export interface Product {
  variation_id: string;
  ITEM_NAME: string;
  COLOR: string;
  SECONDARYCOLOUR: string;
  DEPARTMENT_DESCRIPTION: string;
  CATEGORY: string;
  CLASS_DESCRIPTION: string;
  SUB_CLASS_DESCRIPTION: string;
  PRICE: number;
  generated_tags: string[];
  image_url: string;
  alt_image_urls: string[];
  dimensions: string;
}

export interface FilterResponse {
  products: Product[];
  count: number;
  filters_applied: {
    category: string | null;
    color: string | null;
    min_price: number | null;
    max_price: number | null;
  };
}

export interface CategoriesResponse {
  categories: string[];
  count: number;
}

export interface ColorsResponse {
  colors: string[];
  count: number;
}

export interface PriceRangeResponse {
  min_price: number;
  max_price: number;
}

export interface StyleOption {
  value: string;
  label: string;
  description?: string;
}

export interface MoodsResponse {
  moods: StyleOption[];
}

export interface StylesResponse {
  styles: StyleOption[];
}

export interface ColorThemesResponse {
  color_themes: StyleOption[];
}

export interface RoomsResponse {
  rooms: StyleOption[];
}

export interface StylingPlan {
  scene_prompt: string;
  scene_description: string;
  styling_parameters: {
    mood: string;
    style: string;
    color_theme: string;
    room_type: string;
  };
  product_count: number;
  products_included: string[];
  feedback_applied?: string;
  is_refinement?: boolean;
}

export interface GenerateStyleRequest {
  product_ids: string[];
  mood?: string;
  style?: string;
  color_theme?: string;
  room_type?: string;
  model_quality: 'fast' | 'high';
}

export interface GenerateStyleResponse {
  success: boolean;
  image_base64?: string;
  styling_plan: StylingPlan;
  model_used?: string;
  skipped_products: string[];
  error?: string;
}

export interface RegenerateRequest {
  product_ids: string[];
  previous_plan: StylingPlan;
  feedback: string;
  model_quality: 'fast' | 'high';
}
