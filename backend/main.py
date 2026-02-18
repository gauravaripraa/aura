"""
Smart Product Styler - FastAPI Backend
Main API server with endpoints for product filtering, styling, and image generation.
"""

import os
import json
import logging
from pathlib import Path
from typing import Optional, Literal
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import agents and services
from agents.filter_agent import filter_products, get_available_categories, get_available_colors, get_price_range, load_products
from agents.styling_agent import create_styling_plan, refine_styling_plan, get_mood_options, get_style_options, get_color_theme_options, get_room_options
from agents.image_agent import generate_styled_image, generate_image_text_only
from services.image_fetcher import fetch_product_images

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data path
DATA_PATH = Path(__file__).parent.parent / "data" / "products.json"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Starting Smart Product Styler API...")
    logger.info(f"Google Cloud Project: {os.getenv('GOOGLE_CLOUD_PROJECT', 'NOT SET')}")
    logger.info(f"Google Cloud Location: {os.getenv('GOOGLE_CLOUD_LOCATION', 'NOT SET')}")
    yield
    logger.info("Shutting down Smart Product Styler API...")


# Initialize FastAPI app
app = FastAPI(
    title="Smart Product Styler API",
    description="AI-powered product styling system using Google Vertex AI and ADK",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Pydantic Models ==============

class FilterRequest(BaseModel):
    """Request model for product filtering."""
    category: Optional[str] = None
    color: Optional[str] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)


class GenerateStyleRequest(BaseModel):
    """Request model for style generation."""
    product_ids: list[str] = Field(..., min_length=1, max_length=5)
    mood: str = "cozy"
    style: str = "modern"
    color_theme: str = "neutral"
    room_type: str = "living room"
    model_quality: Literal["fast", "high"] = "fast"


class RegenerateRequest(BaseModel):
    """Request model for image regeneration with feedback."""
    product_ids: list[str] = Field(..., min_length=1, max_length=5)
    previous_plan: dict
    feedback: str
    model_quality: Literal["fast", "high"] = "fast"


# ============== Health Check ==============

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Smart Product Styler API",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "google_cloud_project": os.getenv("GOOGLE_CLOUD_PROJECT", "NOT SET"),
        "google_cloud_location": os.getenv("GOOGLE_CLOUD_LOCATION", "NOT SET"),
    }


# ============== Product Endpoints ==============

@app.get("/products")
async def get_products(
    category: Optional[str] = None,
    color: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
):
    """
    Get all products or filter by criteria.
    
    Query Parameters:
    - category: Filter by CLASS_DESCRIPTION
    - color: Filter by COLOR
    - min_price: Minimum price
    - max_price: Maximum price
    """
    result = filter_products(
        category=category,
        color=color,
        min_price=min_price,
        max_price=max_price,
    )
    return result


@app.post("/filter")
async def filter_products_endpoint(request: FilterRequest):
    """
    Filter products based on criteria.
    
    Request Body:
    - category: Category filter (e.g., "Rugs", "Lighting")
    - color: Color filter (e.g., "Beige", "Black")
    - min_price: Minimum price
    - max_price: Maximum price
    """
    result = filter_products(
        category=request.category,
        color=request.color,
        min_price=request.min_price,
        max_price=request.max_price,
    )
    return result


@app.get("/products/{product_id}")
async def get_product_by_id(product_id: str):
    """Get a single product by variation_id."""
    products = load_products()
    for product in products:
        if product.get("variation_id") == product_id:
            return product
    raise HTTPException(status_code=404, detail=f"Product {product_id} not found")


@app.get("/categories")
async def get_categories():
    """Get all available product categories."""
    return get_available_categories()


@app.get("/colors")
async def get_colors():
    """Get all available product colors."""
    return get_available_colors()


@app.get("/price-range")
async def get_prices():
    """Get the price range of all products."""
    return get_price_range()


@app.get("/data/styled_room_images.json")
async def get_styled_room_images():
    """Get styled room images gallery data."""
    styled_rooms_path = Path(__file__).parent.parent / "data" / "styled_room_images.json"
    
    if not styled_rooms_path.exists():
        raise HTTPException(status_code=404, detail="Styled room images data not found")
    
    try:
        with open(styled_rooms_path, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        logger.error(f"Error loading styled room images: {e}")
        raise HTTPException(status_code=500, detail="Failed to load styled room images")


# ============== Styling Options ==============

@app.get("/styling/moods")
async def get_moods():
    """Get available mood options for styling."""
    return get_mood_options()


@app.get("/styling/styles")
async def get_styles():
    """Get available design style options."""
    return get_style_options()


@app.get("/styling/color-themes")
async def get_color_themes():
    """Get available color theme options."""
    return get_color_theme_options()


@app.get("/styling/rooms")
async def get_rooms():
    """Get available room type options."""
    return get_room_options()


# ============== Image Generation ==============

@app.post("/generate-style")
async def generate_style(request: GenerateStyleRequest):
    """
    Generate a styled image featuring selected products.
    Uses image-to-image generation to preserve exact product appearance.
    
    Request Body:
    - product_ids: List of product variation_ids (1-4 products)
    - mood: Mood for the scene (cozy, elegant, minimalist, vibrant, relaxing)
    - style: Design style (modern, scandinavian, bohemian, industrial, classic)
    - color_theme: Color palette (neutral, warm, cool, bold, monochrome)
    - room_type: Room setting (living room, bedroom, dining room, office)
    - model_quality: "fast" or "high" quality model
    """
    # Load all products
    all_products = load_products()
    
    # Find selected products
    selected_products = []
    for pid in request.product_ids:
        for product in all_products:
            if product.get("variation_id") == pid:
                selected_products.append(product)
                break
    
    if not selected_products:
        raise HTTPException(status_code=400, detail="No valid products found for the given IDs")
    
    logger.info(f"Generating style for {len(selected_products)} products")
    
    # Create styling plan with enhanced product details
    styling_plan = create_styling_plan(
        products=selected_products,
        mood=request.mood,
        style=request.style,
        color_theme=request.color_theme,
        room_type=request.room_type,
    )
    
    # Fetch product images (primary only)
    successful_fetches, failed_fetches = await fetch_product_images(
        selected_products,
        fetch_alternates=False,
    )
    
    skipped_products = [p.get("ITEM_NAME", "Unknown") for p in failed_fetches]
    if skipped_products:
        logger.warning(f"Skipped products due to image fetch failure: {skipped_products}")
    
    # Generate the styled image
    if successful_fetches:
        # Extract main image for each product and get product details
        product_images = []
        products_with_images = []
        
        for product, images in successful_fetches:
            product_images.append(images[0])  # Main image
            products_with_images.append(product)
        
        logger.info(f"Generating with {len(product_images)} product images using image-to-image")
        
        result = generate_styled_image(
            scene_prompt=styling_plan["scene_prompt"],
            product_images=product_images,
            product_details=products_with_images,
            model_quality=request.model_quality,
        )
    else:
        # Fallback to text-only generation
        logger.warning("No product images available, using text-only generation")
        product_descriptions = [
            f"{p.get('ITEM_NAME', '')}: {p.get('CLASS_DESCRIPTION', '')} in {p.get('COLOR', '')}, dimensions: {p.get('dimensions', 'N/A')}"
            for p in selected_products
        ]
        
        result = generate_image_text_only(
            scene_prompt=styling_plan["scene_prompt"],
            product_descriptions=product_descriptions,
            model_quality=request.model_quality,
        )
    
    return {
        "success": result.get("success", False),
        "image_base64": result.get("image_base64"),
        "styling_plan": styling_plan,
        "model_used": result.get("model_used"),
        "generation_mode": result.get("generation_mode", "unknown"),
        "skipped_products": skipped_products,
        "error": result.get("error"),
    }


@app.post("/regenerate")
async def regenerate_image(request: RegenerateRequest):
    """
    Regenerate an image with user feedback.
    Uses image-to-image generation to preserve exact product appearance.
    
    Request Body:
    - product_ids: List of product variation_ids
    - previous_plan: The previous styling plan dict
    - feedback: User's feedback for refinement
    - model_quality: "fast" or "high" quality model
    """
    # Load all products
    all_products = load_products()
    
    # Find selected products
    selected_products = []
    for pid in request.product_ids:
        for product in all_products:
            if product.get("variation_id") == pid:
                selected_products.append(product)
                break
    
    if not selected_products:
        raise HTTPException(status_code=400, detail="No valid products found for the given IDs")
    
    logger.info(f"Regenerating with feedback: {request.feedback}")
    
    # Refine the styling plan with feedback
    refined_plan = refine_styling_plan(
        previous_plan=request.previous_plan,
        feedback=request.feedback,
    )
    
    # Fetch product images (primary only)
    successful_fetches, failed_fetches = await fetch_product_images(
        selected_products,
        fetch_alternates=False,
    )
    
    skipped_products = [p.get("ITEM_NAME", "Unknown") for p in failed_fetches]
    
    # Generate the refined image
    if successful_fetches:
        # Extract main image for each product and get product details
        product_images = []
        products_with_images = []
        
        for product, images in successful_fetches:
            product_images.append(images[0])  # Main image
            products_with_images.append(product)
        
        result = generate_styled_image(
            scene_prompt=refined_plan["scene_prompt"],
            product_images=product_images,
            product_details=products_with_images,
            model_quality=request.model_quality,
        )
    else:
        product_descriptions = [
            f"{p.get('ITEM_NAME', '')}: {p.get('CLASS_DESCRIPTION', '')} in {p.get('COLOR', '')}, dimensions: {p.get('dimensions', 'N/A')}"
            for p in selected_products
        ]
        
        result = generate_image_text_only(
            scene_prompt=refined_plan["scene_prompt"],
            product_descriptions=product_descriptions,
            model_quality=request.model_quality,
        )
    
    return {
        "success": result.get("success", False),
        "image_base64": result.get("image_base64"),
        "styling_plan": refined_plan,
        "model_used": result.get("model_used"),
        "generation_mode": result.get("generation_mode", "unknown"),
        "skipped_products": skipped_products,
        "feedback_applied": request.feedback,
        "error": result.get("error"),
    }


# ============== Run Server ==============

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
    )
