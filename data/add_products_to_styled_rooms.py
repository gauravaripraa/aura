import json
import random
from typing import List, Dict, Any

def normalize_string(s: str) -> str:
    """Normalize string for comparison."""
    if s is None:
        return ""
    return s.lower().strip().replace("-", " ").replace("_", " ")

def find_matching_products(
    products: List[Dict[str, Any]], 
    category: str, 
    color: str, 
    count: int = 4
) -> List[Dict[str, Any]]:
    """
    Find products matching the category and color.
    Returns up to 'count' products with required fields.
    """
    normalized_category = normalize_string(category)
    normalized_color = normalize_string(color)
    
    # Find exact matches first
    exact_matches = []
    for product in products:
        product_color = normalize_string(product.get("COLOR", ""))
        product_secondary_color = normalize_string(product.get("SECONDARYCOLOUR", ""))
        product_primary_category = normalize_string(product.get("CLASS_DESCRIPTION", ""))
        
        # Check if color matches (primary or secondary)
        color_match = (
            normalized_color in product_color or 
            product_color in normalized_color or
            normalized_color in product_secondary_color or
            product_secondary_color in normalized_color
        )
        
        # Check if category matches
        category_match = (
            normalized_category in product_primary_category or
            product_primary_category in normalized_category
        )
        
        if color_match and category_match:
            exact_matches.append(product)
    
    # If not enough exact matches, try category-only matches
    if len(exact_matches) < count:
        for product in products:
            if product in exact_matches:
                continue
                
            product_primary_category = normalize_string(product.get("CLASS_DESCRIPTION", ""))
            
            if (normalized_category in product_primary_category or 
                product_primary_category in normalized_category):
                exact_matches.append(product)
                
                if len(exact_matches) >= count * 2:  # Get extras to choose from
                    break
    
    # If still not enough, try color-only matches
    if len(exact_matches) < count:
        for product in products:
            if product in exact_matches:
                continue
                
            product_color = normalize_string(product.get("COLOR", ""))
            product_secondary_color = normalize_string(product.get("SECONDARYCOLOUR", ""))
            
            if (normalized_color in product_color or 
                product_color in normalized_color or
                normalized_color in product_secondary_color or
                product_secondary_color in normalized_color):
                exact_matches.append(product)
                
                if len(exact_matches) >= count * 2:
                    break
    
    # Shuffle and take the first 'count' items
    if exact_matches:
        random.shuffle(exact_matches)
        selected = exact_matches[:count]
    else:
        # If no matches at all, just take random products
        selected = random.sample(products, min(count, len(products)))
    
    # Extract required fields - just variation_id strings
    result = []
    for product in selected:
        result.append(product.get("variation_id", ""))
    
    return result

def main():
    # Load products
    print("Loading products.json...")
    with open("products.json", "r", encoding="utf-8") as f:
        products = json.load(f)
    print(f"Loaded {len(products)} products")
    
    # Load styled rooms
    print("Loading styled_room_images.json...")
    with open("styled_room_images.json", "r", encoding="utf-8") as f:
        styled_data = json.load(f)
    print(f"Loaded {len(styled_data['styled_rooms'])} styled rooms")
    
    # Process each styled room
    print("\nAdding products to styled rooms...")
    for idx, room in enumerate(styled_data["styled_rooms"], 1):
        category = room.get("category", "")
        color = room.get("color", "")
        
        print(f"Processing {idx}/{len(styled_data['styled_rooms'])}: {room['id']} - {category} / {color}")
        
        # Find 3-4 matching products
        num_products = random.randint(3, 4)
        matching_products = find_matching_products(products, category, color, num_products)
        
        # Add products_included field
        room["products_included"] = matching_products
        
        print(f"  → Added {len(matching_products)} products")
    
    # Save updated data
    print("\nSaving updated styled_room_images.json...")
    with open("styled_room_images.json", "w", encoding="utf-8") as f:
        json.dump(styled_data, f, indent=2, ensure_ascii=False)
    
    print("\n✅ Done! All styled rooms now have products_included field.")
    print(f"Total styled rooms: {len(styled_data['styled_rooms'])}")

if __name__ == "__main__":
    random.seed(42)  # For reproducibility
    main()
