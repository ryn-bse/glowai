from dataclasses import dataclass, field
import numpy as np
import cv2

try:
    from mtcnn import MTCNN
    _mtcnn = MTCNN()
    MTCNN_AVAILABLE = True
except Exception:
    _mtcnn = None
    MTCNN_AVAILABLE = False


class NoFaceError(Exception):
    """Raised when no face is detected in the image."""
    pass


class MultipleFacesError(Exception):
    """Raised when more than one face is detected."""
    pass


@dataclass
class BoundingBox:
    x: int
    y: int
    w: int
    h: int

    def to_dict(self) -> dict:
        return {"x": self.x, "y": self.y, "w": self.w, "h": self.h}


@dataclass
class FaceRegions:
    forehead: BoundingBox
    left_cheek: BoundingBox
    right_cheek: BoundingBox
    chin: BoundingBox
    face_bbox: BoundingBox  # overall face bounding box
    image: np.ndarray       # the 224x224 tensor passed in

    def to_dict(self) -> dict:
        return {
            "forehead": self.forehead.to_dict(),
            "left_cheek": self.left_cheek.to_dict(),
            "right_cheek": self.right_cheek.to_dict(),
            "chin": self.chin.to_dict(),
        }


def _segment_regions(face_bbox: BoundingBox, img_h: int, img_w: int) -> dict[str, BoundingBox]:
    """
    Derive forehead, cheeks, and chin bounding boxes from the face bounding box.
    Uses proportional offsets relative to face height/width.
    """
    x, y, w, h = face_bbox.x, face_bbox.y, face_bbox.w, face_bbox.h

    # Forehead: top 25% of face height, full width
    forehead = BoundingBox(
        x=max(0, x),
        y=max(0, y),
        w=min(w, img_w - x),
        h=max(1, int(h * 0.25)),
    )

    # Left cheek: left 30% width, middle 30-65% height
    left_cheek = BoundingBox(
        x=max(0, x),
        y=max(0, y + int(h * 0.30)),
        w=max(1, int(w * 0.30)),
        h=max(1, int(h * 0.35)),
    )

    # Right cheek: right 30% width, middle 30-65% height
    right_cheek = BoundingBox(
        x=max(0, x + int(w * 0.70)),
        y=max(0, y + int(h * 0.30)),
        w=max(1, int(w * 0.30)),
        h=max(1, int(h * 0.35)),
    )

    # Chin: bottom 20% of face height, full width
    chin = BoundingBox(
        x=max(0, x),
        y=max(0, y + int(h * 0.80)),
        w=min(w, img_w - x),
        h=max(1, int(h * 0.20)),
    )

    return {
        "forehead": forehead,
        "left_cheek": left_cheek,
        "right_cheek": right_cheek,
        "chin": chin,
    }


def _detect_with_mtcnn(tensor: np.ndarray) -> list[dict]:
    """Run MTCNN face detection. Returns list of face dicts with 'box' key."""
    img_uint8 = (tensor * 255).astype(np.uint8)
    return _mtcnn.detect_faces(img_uint8)


def _detect_with_opencv(tensor: np.ndarray) -> list[tuple]:
    """Fallback: OpenCV Haar cascade face detection."""
    img_uint8 = (tensor * 255).astype(np.uint8)
    gray = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2GRAY)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    return list(faces) if len(faces) > 0 else []


def detect_and_segment(tensor: np.ndarray) -> FaceRegions:
    """
    Detect face in a (224, 224, 3) float32 tensor and segment into skin regions.

    Returns:
        FaceRegions with bounding boxes for forehead, left_cheek, right_cheek, chin

    Raises:
        NoFaceError: if no face is detected
        MultipleFacesError: if more than one face is detected
    """
    img_h, img_w = tensor.shape[:2]

    # Try MTCNN first, fall back to OpenCV
    if MTCNN_AVAILABLE:
        faces = _detect_with_mtcnn(tensor)
        if len(faces) == 0:
            # Try OpenCV as fallback before giving up
            cv_faces = _detect_with_opencv(tensor)
            if len(cv_faces) == 0:
                raise NoFaceError("No face detected in the image.")
            if len(cv_faces) > 1:
                raise MultipleFacesError("Multiple faces detected. Please submit an image with only one face.")
            x, y, w, h = cv_faces[0]
            face_bbox = BoundingBox(x=int(x), y=int(y), w=int(w), h=int(h))
        elif len(faces) > 1:
            raise MultipleFacesError("Multiple faces detected. Please submit an image with only one face.")
        else:
            box = faces[0]["box"]  # [x, y, w, h]
            face_bbox = BoundingBox(
                x=max(0, int(box[0])),
                y=max(0, int(box[1])),
                w=int(box[2]),
                h=int(box[3]),
            )
    else:
        cv_faces = _detect_with_opencv(tensor)
        if len(cv_faces) == 0:
            raise NoFaceError("No face detected in the image.")
        if len(cv_faces) > 1:
            raise MultipleFacesError("Multiple faces detected. Please submit an image with only one face.")
        x, y, w, h = cv_faces[0]
        face_bbox = BoundingBox(x=int(x), y=int(y), w=int(w), h=int(h))

    regions = _segment_regions(face_bbox, img_h, img_w)

    return FaceRegions(
        forehead=regions["forehead"],
        left_cheek=regions["left_cheek"],
        right_cheek=regions["right_cheek"],
        chin=regions["chin"],
        face_bbox=face_bbox,
        image=tensor,
    )
