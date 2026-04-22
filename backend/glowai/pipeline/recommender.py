"""
Recommendation Engine for GlowAI.

Hybrid approach:
  - Content-based filtering: ingredient-condition compatibility scoring
  - Collaborative filtering: cosine similarity over skin-profile feature vectors
  - Final score: 0.7 * content_score + 0.3 * cf_score
  - Hard allergen exclusion applied before scoring
"""
from __future__ import annotations
import numpy as np
from glowai.models.product import query_products

ALPHA = 0.7  # weight for content-based score

SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"]
CONDITIONS = ["acne", "dark_spots", "enlarged_pores", "wrinkles"]

# Ingredient → condition compatibility map
# Score 1.0 = highly compatible, 0.0 = no relation
INGREDIENT_CONDITION_MAP: dict[str, dict[str, float]] = {
    "salicylic acid":    {"acne": 1.0, "enlarged_pores": 0.8, "dark_spots": 0.3},
    "benzoyl peroxide":  {"acne": 1.0},
    "niacinamide":       {"dark_spots": 0.9, "enlarged_pores": 0.8, "acne": 0.5},
    "retinol":           {"wrinkles": 1.0, "dark_spots": 0.8, "acne": 0.4},
    "vitamin c":         {"dark_spots": 1.0, "wrinkles": 0.7},
    "hyaluronic acid":   {"wrinkles": 0.6},
    "glycolic acid":     {"dark_spots": 0.8, "enlarged_pores": 0.7, "wrinkles": 0.5},
    "lactic acid":       {"dark_spots": 0.7, "wrinkles": 0.4},
    "azelaic acid":      {"acne": 0.8, "dark_spots": 0.7},
    "zinc oxide":        {"acne": 0.6},
    "tea tree oil":      {"acne": 0.9},
    "kojic acid":        {"dark_spots": 0.9},
    "peptides":          {"wrinkles": 0.9},
    "ceramides":         {"wrinkles": 0.4},
    "spf":               {},
}


def _build_user_feature_vector(user_profile: dict) -> np.ndarray:
    """
    Build a binary feature vector from user skin profile.
    Vector: [skin_type_ohe (5), condition_flags (4)] = length 9
    """
    skin_profile = user_profile.get("skin_profile", {})
    skin_type = skin_profile.get("skin_type", "")
    known_conditions = [c.get("name", "") for c in user_profile.get("_conditions", [])]

    vec = np.zeros(len(SKIN_TYPES) + len(CONDITIONS), dtype=np.float32)
    if skin_type in SKIN_TYPES:
        vec[SKIN_TYPES.index(skin_type)] = 1.0
    for i, cond in enumerate(CONDITIONS):
        if cond in known_conditions:
            vec[len(SKIN_TYPES) + i] = 1.0
    return vec


def _build_product_feature_vector(product: dict) -> np.ndarray:
    """
    Build a binary feature vector from product target skin types and conditions.
    Vector: [skin_type_ohe (5), condition_flags (4)] = length 9
    """
    vec = np.zeros(len(SKIN_TYPES) + len(CONDITIONS), dtype=np.float32)
    for st in product.get("target_skin_types", []):
        if st in SKIN_TYPES:
            vec[SKIN_TYPES.index(st)] = 1.0
    for cond in product.get("target_conditions", []):
        if cond in CONDITIONS:
            vec[len(SKIN_TYPES) + CONDITIONS.index(cond)] = 1.0
    return vec


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _content_score(product: dict, detected_conditions: list[dict]) -> float:
    """
    Score a product based on ingredient-condition compatibility.
    Returns a score in [0.0, 1.0].
    """
    if not detected_conditions:
        return 0.5  # neutral score when no conditions detected

    ingredients_lower = [ing.lower() for ing in product.get("ingredients", [])]
    total_score = 0.0
    total_weight = 0.0

    for condition_dict in detected_conditions:
        condition_name = condition_dict.get("name", "")
        condition_confidence = condition_dict.get("confidence", 0.5)

        # Find matching ingredients
        best_ingredient_score = 0.0
        for ingredient in ingredients_lower:
            for key, compat_map in INGREDIENT_CONDITION_MAP.items():
                if key in ingredient:
                    score = compat_map.get(condition_name, 0.0)
                    best_ingredient_score = max(best_ingredient_score, score)

        total_score += best_ingredient_score * condition_confidence
        total_weight += condition_confidence

    if total_weight == 0:
        return 0.0
    return min(1.0, total_score / total_weight)


def _cf_score(product: dict, user_profile: dict) -> float:
    """
    Collaborative filtering score using cosine similarity of feature vectors.
    Returns a score in [0.0, 1.0].
    """
    user_vec = _build_user_feature_vector(user_profile)
    product_vec = _build_product_feature_vector(product)
    return _cosine_similarity(user_vec, product_vec)


def _is_allergen_free(product: dict, known_allergies: list[str]) -> bool:
    """Return True if product contains none of the user's declared allergens."""
    if not known_allergies:
        return True
    ingredients_lower = {ing.lower() for ing in product.get("ingredients", [])}
    for allergen in known_allergies:
        if allergen.lower() in ingredients_lower:
            return False
    return True


def recommend(analysis_result: dict, user_profile: dict) -> list[dict]:
    """
    Generate top-10 product recommendations for a user based on their skin analysis.

    Args:
        analysis_result: Output from cnn_classifier.classify()
        user_profile: User document from MongoDB

    Returns:
        List of up to 10 dicts with keys: product_id, compatibility_score, rank
        Sorted by compatibility_score descending.
    """
    skin_profile = user_profile.get("skin_profile", {})
    skin_type = analysis_result.get("skin_type")
    detected_conditions = analysis_result.get("conditions", [])
    known_allergies = skin_profile.get("known_allergies", [])

    # Attach detected conditions to user profile for CF vector building
    user_profile_with_conditions = {
        **user_profile,
        "_conditions": detected_conditions,
    }

    # Query candidate products filtered by skin type
    candidates = query_products(skin_type=skin_type)

    # If no skin-type-specific products, fall back to all products
    if not candidates:
        candidates = query_products()

    # Hard filter: remove allergen-containing products
    candidates = [p for p in candidates if _is_allergen_free(p, known_allergies)]

    if not candidates:
        return []

    # Score each candidate
    scored = []
    for product in candidates:
        c_score = _content_score(product, detected_conditions)
        cf = _cf_score(product, user_profile_with_conditions)
        final_score = ALPHA * c_score + (1 - ALPHA) * cf
        scored.append({
            "product_id": product["_id"],
            "compatibility_score": round(min(1.0, max(0.0, final_score)), 4),
            "rank": 0,  # assigned after sorting
        })

    # Sort by compatibility_score descending
    scored.sort(key=lambda x: x["compatibility_score"], reverse=True)

    # Take top 10 and assign ranks
    top10 = scored[:10]
    for i, item in enumerate(top10):
        item["rank"] = i + 1

    return top10
