"""
Seed script — populates the products table in Supabase PostgreSQL.
Run once: python seed_products.py
"""
import os
os.environ.setdefault("SUPABASE_URL", "https://oufkyoraefgryjxjbiep.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91Zmt5b3JhZWZncnlqeGpiaWVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjEwMjk1MCwiZXhwIjoyMDkxNjc4OTUwfQ.9Wi1TtLrhWNK1CQLzENR7dajXGnX-FXHE0ejt8BVU0I")

from glowai.models.product import insert_product, ValidationError
from glowai.db import get_db

PRODUCTS = [
    {"name": "CeraVe Foaming Facial Cleanser", "brand": "CeraVe", "category": "cleanser",
     "ingredients": ["niacinamide", "ceramides", "hyaluronic acid", "zinc"],
     "target_skin_types": ["oily", "combination", "normal"], "target_conditions": ["acne", "enlarged_pores"],
     "image_url": "https://via.placeholder.com/80x80?text=CeraVe"},
    {"name": "La Roche-Posay Effaclar Duo", "brand": "La Roche-Posay", "category": "treatment",
     "ingredients": ["benzoyl peroxide", "niacinamide", "salicylic acid"],
     "target_skin_types": ["oily", "combination"], "target_conditions": ["acne", "enlarged_pores"],
     "image_url": "https://via.placeholder.com/80x80?text=Effaclar"},
    {"name": "Neutrogena Hydro Boost Water Gel", "brand": "Neutrogena", "category": "moisturizer",
     "ingredients": ["hyaluronic acid", "glycerin", "ceramides"],
     "target_skin_types": ["dry", "normal", "sensitive"], "target_conditions": ["wrinkles"],
     "image_url": "https://via.placeholder.com/80x80?text=HydroBoost"},
    {"name": "TruSkin Vitamin C Serum", "brand": "TruSkin", "category": "serum",
     "ingredients": ["vitamin c", "hyaluronic acid", "vitamin e", "retinol"],
     "target_skin_types": ["normal", "dry", "combination", "oily"], "target_conditions": ["dark_spots", "wrinkles"],
     "image_url": "https://via.placeholder.com/80x80?text=VitC"},
    {"name": "Paula's Choice 2% BHA Liquid Exfoliant", "brand": "Paula's Choice", "category": "treatment",
     "ingredients": ["salicylic acid", "niacinamide", "glycerin"],
     "target_skin_types": ["oily", "combination"], "target_conditions": ["acne", "enlarged_pores", "dark_spots"],
     "image_url": "https://via.placeholder.com/80x80?text=BHA"},
    {"name": "RoC Retinol Correxion Eye Cream", "brand": "RoC", "category": "treatment",
     "ingredients": ["retinol", "peptides", "hyaluronic acid"],
     "target_skin_types": ["normal", "dry", "combination"], "target_conditions": ["wrinkles", "dark_spots"],
     "image_url": "https://via.placeholder.com/80x80?text=Retinol"},
    {"name": "Cetaphil Gentle Skin Cleanser", "brand": "Cetaphil", "category": "cleanser",
     "ingredients": ["glycerin", "niacinamide", "panthenol"],
     "target_skin_types": ["sensitive", "dry", "normal"], "target_conditions": ["acne"],
     "image_url": "https://via.placeholder.com/80x80?text=Cetaphil"},
    {"name": "The Ordinary Niacinamide 10% + Zinc 1%", "brand": "The Ordinary", "category": "serum",
     "ingredients": ["niacinamide", "zinc oxide"],
     "target_skin_types": ["oily", "combination"], "target_conditions": ["acne", "enlarged_pores", "dark_spots"],
     "image_url": "https://via.placeholder.com/80x80?text=Niacinamide"},
    {"name": "Olay Regenerist Micro-Sculpting Cream", "brand": "Olay", "category": "moisturizer",
     "ingredients": ["peptides", "hyaluronic acid", "niacinamide", "glycerin"],
     "target_skin_types": ["normal", "dry", "combination"], "target_conditions": ["wrinkles"],
     "image_url": "https://via.placeholder.com/80x80?text=Olay"},
    {"name": "Murad Rapid Age Spot Correcting Serum", "brand": "Murad", "category": "serum",
     "ingredients": ["kojic acid", "glycolic acid", "vitamin c", "niacinamide"],
     "target_skin_types": ["normal", "oily", "combination"], "target_conditions": ["dark_spots"],
     "image_url": "https://via.placeholder.com/80x80?text=Murad"},
    {"name": "EltaMD UV Clear Broad-Spectrum SPF 46", "brand": "EltaMD", "category": "sunscreen",
     "ingredients": ["zinc oxide", "niacinamide", "spf", "hyaluronic acid"],
     "target_skin_types": ["oily", "sensitive", "combination", "normal"], "target_conditions": ["acne", "dark_spots"],
     "image_url": "https://via.placeholder.com/80x80?text=EltaMD"},
    {"name": "Drunk Elephant Framboos Glycolic Night Serum", "brand": "Drunk Elephant", "category": "serum",
     "ingredients": ["glycolic acid", "lactic acid", "salicylic acid", "niacinamide"],
     "target_skin_types": ["normal", "oily", "combination"], "target_conditions": ["dark_spots", "enlarged_pores", "wrinkles"],
     "image_url": "https://via.placeholder.com/80x80?text=Framboos"},
    {"name": "First Aid Beauty Ultra Repair Cream", "brand": "First Aid Beauty", "category": "moisturizer",
     "ingredients": ["ceramides", "hyaluronic acid", "colloidal oatmeal", "glycerin"],
     "target_skin_types": ["dry", "sensitive"], "target_conditions": ["wrinkles"],
     "image_url": "https://via.placeholder.com/80x80?text=FAB"},
    {"name": "Tea Tree Oil Spot Treatment", "brand": "The Body Shop", "category": "treatment",
     "ingredients": ["tea tree oil", "zinc oxide"],
     "target_skin_types": ["oily", "combination"], "target_conditions": ["acne"],
     "image_url": "https://via.placeholder.com/80x80?text=TeaTree"},
    {"name": "Azelaic Acid Suspension 10%", "brand": "The Ordinary", "category": "treatment",
     "ingredients": ["azelaic acid"],
     "target_skin_types": ["oily", "combination", "sensitive"], "target_conditions": ["acne", "dark_spots"],
     "image_url": "https://via.placeholder.com/80x80?text=Azelaic"},
]


def seed():
    # Clear existing products
    db = get_db()
    db.table("products").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    print("Cleared existing products.")

    inserted = 0
    for p in PRODUCTS:
        try:
            insert_product(p)
            inserted += 1
            print(f"  ✓ {p['name']}")
        except ValidationError as e:
            print(f"  ✗ {p['name']}: {e}")
        except Exception as e:
            print(f"  ✗ {p['name']}: {e}")

    print(f"\nSeeded {inserted}/{len(PRODUCTS)} products.")


if __name__ == "__main__":
    seed()
