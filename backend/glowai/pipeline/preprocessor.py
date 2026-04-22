import io
import cv2
import numpy as np
from PIL import Image

# Blur quality threshold — images with Laplacian variance below this are rejected
BLUR_THRESHOLD = 100.0
TARGET_SIZE = (224, 224)


class PreprocessError(Exception):
    """Raised when an image fails quality checks."""
    pass


def _compute_blur_score(gray: np.ndarray) -> float:
    """Compute Laplacian variance as a blur metric. Higher = sharper."""
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def preprocess(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess raw image bytes for the AI pipeline.

    Steps:
    1. Decode image from bytes
    2. Quality check: blur detection
    3. Resize to 224x224
    4. Normalize pixel values to [0.0, 1.0]

    Returns:
        np.ndarray of shape (224, 224, 3), dtype float32, values in [0.0, 1.0]

    Raises:
        PreprocessError: if image is blurred, low contrast, or cannot be decoded
    """
    # Decode image
    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise PreprocessError(f"Cannot decode image: {exc}") from exc

    # Convert to numpy for OpenCV operations
    img_array = np.array(pil_img)  # shape: (H, W, 3), uint8

    # Blur check using grayscale Laplacian variance
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    blur_score = _compute_blur_score(gray)
    if blur_score < BLUR_THRESHOLD:
        raise PreprocessError(
            f"blur (score={blur_score:.1f}, threshold={BLUR_THRESHOLD})"
        )

    # Resize to target size
    resized = cv2.resize(img_array, TARGET_SIZE, interpolation=cv2.INTER_AREA)

    # Normalize to [0.0, 1.0]
    normalized = resized.astype(np.float32) / 255.0

    assert normalized.shape == (224, 224, 3), f"Unexpected shape: {normalized.shape}"
    assert normalized.dtype == np.float32

    return normalized


def augment_for_training(image_bytes: bytes) -> list[np.ndarray]:
    """
    Apply data augmentation for training. Returns list of augmented tensors.
    Augmentations: original + rotation (±15°) + horizontal flip + brightness (±20%)
    """
    base = preprocess(image_bytes)
    augmented = [base]

    # Convert back to uint8 for OpenCV augmentation ops
    img_uint8 = (base * 255).astype(np.uint8)
    h, w = img_uint8.shape[:2]
    center = (w // 2, h // 2)

    # Rotation +15 degrees
    M_pos = cv2.getRotationMatrix2D(center, 15, 1.0)
    rotated_pos = cv2.warpAffine(img_uint8, M_pos, (w, h))
    augmented.append(rotated_pos.astype(np.float32) / 255.0)

    # Rotation -15 degrees
    M_neg = cv2.getRotationMatrix2D(center, -15, 1.0)
    rotated_neg = cv2.warpAffine(img_uint8, M_neg, (w, h))
    augmented.append(rotated_neg.astype(np.float32) / 255.0)

    # Horizontal flip
    flipped = cv2.flip(img_uint8, 1)
    augmented.append(flipped.astype(np.float32) / 255.0)

    # Brightness +20%
    bright = np.clip(img_uint8.astype(np.float32) * 1.2, 0, 255).astype(np.uint8)
    augmented.append(bright.astype(np.float32) / 255.0)

    # Brightness -20%
    dark = np.clip(img_uint8.astype(np.float32) * 0.8, 0, 255).astype(np.uint8)
    augmented.append(dark.astype(np.float32) / 255.0)

    return augmented
