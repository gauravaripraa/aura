"""
Image Generation Agent
Uses Google Vertex AI Imagen for image editing/composition to create styled scenes
featuring the exact products selected by the user.
"""

import base64
import os
import re
from typing import Optional, Literal
from google.adk.agents import Agent
from google import genai
from google.genai import types


def get_genai_client():
    """Initialize the Google Gen AI client for Vertex AI."""
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    
    return genai.Client(
        vertexai=True,
        project=project_id,
        location=location,
    )


def extract_dimensions_from_text(text: str) -> dict:
    """
    Extract product dimensions from description text.
    
    Returns dict with height, width, depth if found.
    """
    dimensions = {}
    
    # Extract height/length
    h_match = re.search(r'(\d+(?:\.\d+)?)\s*cm\s*\(H\)', text, re.IGNORECASE)
    l_match = re.search(r'(\d+(?:\.\d+)?)\s*cm\s*\(L\)', text, re.IGNORECASE)
    w_match = re.search(r'(\d+(?:\.\d+)?)\s*cm\s*\(W\)', text, re.IGNORECASE)
    d_match = re.search(r'(\d+(?:\.\d+)?)\s*cm\s*\(D\)', text, re.IGNORECASE)
    dia_match = re.search(r'(\d+(?:\.\d+)?)\s*cm\s*\(Dia\.\)', text, re.IGNORECASE)
    
    if h_match:
        dimensions['height'] = float(h_match.group(1))
    elif l_match:
        dimensions['length'] = float(l_match.group(1))
    if w_match:
        dimensions['width'] = float(w_match.group(1))
    if d_match:
        dimensions['depth'] = float(d_match.group(1))
    if dia_match:
        dimensions['diameter'] = float(dia_match.group(1))
    
    # Also try to extract from item name like "235cm x 160cm"
    name_pattern = r'(\d+)\s*cm\s*x\s*(\d+)\s*cm'
    name_match = re.search(name_pattern, text, re.IGNORECASE)
    if name_match and not dimensions:
        dimensions['length'] = float(name_match.group(1))
        dimensions['width'] = float(name_match.group(2))
    
    return dimensions


def build_product_reference_prompt(products: list[dict]) -> str:
    """
    Build a detailed product reference section for the prompt,
    including dimensions and placement instructions.
    Uses new schema with 'dimensions' field.
    """
    product_refs = []
    
    for i, product in enumerate(products, 1):
        name = product.get("ITEM_NAME", "Unknown product")
        color = product.get("COLOR", "")
        secondary_color = product.get("SECONDARYCOLOUR", "")
        category = product.get("CLASS_DESCRIPTION", "")
        # Use dimensions field directly from new schema
        dimensions = product.get("dimensions", "")
        
        # Build color string
        color_desc = color
        if secondary_color and secondary_color != color:
            color_desc = f"{color}/{secondary_color}"
        
        product_refs.append(
            f"PRODUCT {i}: {name}\n"
            f"  - Category: {category}\n"
            f"  - Color: {color_desc}\n"
            f"  - Dimensions: {dimensions if dimensions else 'See reference image'}\n"
            f"  - Reference: Use the attached image #{i} as the EXACT appearance"
        )
    
    return "\n\n".join(product_refs)


def generate_styled_image(
    scene_prompt: str,
    product_images: list[bytes],
    product_details: list[dict],
    model_quality: Literal["fast", "high"] = "fast",
    aspect_ratio: str = "4:3",  # Closest to 12x10ft (6:5)
) -> dict:
    """
    Generate a styled image featuring all provided products using Gemini.
    Uses image-to-image approach where product images are provided as references
    and the model is instructed to preserve their exact appearance.
    
    Args:
        scene_prompt: Detailed prompt describing the scene composition
        product_images: List of product image bytes to include in the scene
        product_details: List of product dictionaries with metadata
        model_quality: "fast" or "high"
        aspect_ratio: Image aspect ratio (4:3 = ~12x10ft)
        
    Returns:
        dict with generated image as base64 and metadata
    """
    client = get_genai_client()
    
    # Use gemini-2.0-flash-image for image generation with reference images
    model_name = "gemini-2.5-flash-image"
    
    # Build detailed product reference prompt
    product_ref_prompt = build_product_reference_prompt(product_details)
    
    # Count of products for emphasis
    product_count = len(product_images)
    
    # Enhanced quality instructions for "high" mode
    quality_instructions = ""
    if model_quality == "high":
        quality_instructions = """
=== HIGH QUALITY REQUIREMENTS ===
- Ultra-high resolution with crisp details on all products
- Professional interior photography lighting (soft diffused natural light)
- Accurate material rendering: fabric textures, wood grain, metal reflections
- Depth of field with products in sharp focus
- Magazine-quality composition and styling
"""
    
    # Create a simple, product-focused prompt with strong emphasis on ALL products
    enhanced_prompt = f"""IMAGE GENERATION TASK - EXACT PRODUCT PLACEMENT:

IMPORTANT: You are provided with {product_count} reference product images. You MUST include ALL {product_count} products in the generated image. DO NOT skip any product.

Create a clean, well-lit interior room photograph (12ft x 10ft room size) that showcases ALL {product_count} EXACT products from the reference images.

{product_ref_prompt}
{quality_instructions}
CRITICAL REQUIREMENTS:
1. INCLUDE ALL {product_count} PRODUCTS - Every single reference image product must appear in the final image
2. USE THE EXACT PRODUCTS from the reference images - do NOT create new or similar products
3. Each product must appear EXACTLY as shown in its reference image (same colors, patterns, textures, shapes)
4. Place products in a simple, neutral room with white/light grey walls and natural lighting
5. All {product_count} products must be clearly visible and recognizable
6. Use realistic proportions based on product dimensions
7. The room should be approximately 12ft x 10ft in scale

MANDATORY: The final image MUST contain exactly {product_count} products - one for each reference image provided. Do NOT omit any product.

OUTPUT: A photorealistic interior photograph featuring ALL {product_count} exact products arranged naturally in the room."""

    # Build the content parts: product images + prompt
    content_parts = []
    
    # Add product images as input references
    for i, img_bytes in enumerate(product_images):
        content_parts.append(
            types.Part.from_bytes(
                data=img_bytes,
                mime_type="image/jpeg",
            )
        )
        # Add label for each image
        content_parts.append(f"[Above is Reference Image #{i+1} - this is the EXACT product to include]")
    
    # Add the enhanced scene prompt
    content_parts.append(enhanced_prompt)
    
    try:
        # Generate the image
        response = client.models.generate_content(
            model=model_name,
            contents=content_parts,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        
        # Extract the generated image
        image_base64 = None
        response_text = None
        
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    image_base64 = base64.b64encode(part.inline_data.data).decode('utf-8')
                elif hasattr(part, 'text') and part.text:
                    response_text = part.text
        
        if image_base64:
            return {
                "success": True,
                "image_base64": image_base64,
                "model_used": model_name,
                "prompt_used": enhanced_prompt,
                "product_count": len(product_images),
                "response_text": response_text,
                "generation_mode": "image_to_image",
            }
        else:
            return {
                "success": False,
                "error": "No image generated in response",
                "response_text": response_text,
                "model_used": model_name,
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "model_used": model_name,
        }


def generate_image_text_only(
    scene_prompt: str,
    product_descriptions: list[str],
    model_quality: Literal["fast", "high"] = "fast",
) -> dict:
    """
    Generate a styled image using only text descriptions (fallback when images unavailable).
    """
    client = get_genai_client()
    
    # Use gemini-2.0-flash-image for text-to-image generation
    model_name = "gemini-2.0-flash-image"
    
    products_text = "\n".join([f"- {desc}" for desc in product_descriptions])
    full_prompt = f"""{scene_prompt}

=== PRODUCTS TO FEATURE ===
{products_text}

Generate a photorealistic interior design image featuring all these products arranged naturally in the scene.
The products should be clearly visible, properly scaled, and styled according to the scene requirements."""

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[full_prompt],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        
        image_base64 = None
        response_text = None
        
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    image_base64 = base64.b64encode(part.inline_data.data).decode('utf-8')
                elif hasattr(part, 'text') and part.text:
                    response_text = part.text
        
        if image_base64:
            return {
                "success": True,
                "image_base64": image_base64,
                "model_used": model_name,
                "prompt_used": full_prompt,
                "generation_mode": "text_only",
                "response_text": response_text,
            }
        else:
            return {
                "success": False,
                "error": "No image generated in response",
                "response_text": response_text,
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


# Create the Image Generation Agent
image_agent = Agent(
    name="image_agent",
    model="gemini-2.0-flash",
    description="Agent that generates photorealistic styled images featuring the EXACT products provided using image-to-image generation.",
    instruction="""You are an AI image generation specialist for e-commerce product styling.

Your job is to generate high-quality, photorealistic images that feature the EXACT products provided as reference images.

CRITICAL: The products in the generated image MUST look IDENTICAL to the reference images - same colors, textures, patterns, and designs. Do NOT generate "similar" products.

When generating images:
1. PRESERVE EXACT PRODUCT APPEARANCE from reference images
2. Ensure all products are visible and properly scaled using their dimensions
3. Create realistic interior photography quality
4. Use appropriate lighting for the mood
5. Compose products in a natural, styled arrangement
""",
    tools=[
        generate_styled_image,
        generate_image_text_only,
    ],
)
