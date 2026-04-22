# GlowAI — System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                              │
│                                                                     │
│   React.js Frontend  (Vite · TypeScript · localhost:5173)           │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│   │  AuthPages   │  │  Dashboard   │  │  ChatBot (floating)      │ │
│   │  (3-step     │  │  ┌─────────┐ │  │  Groq · llama-3.1-8b    │ │
│   │  register /  │  │  │Analyze  │ │  └──────────────────────────┘ │
│   │  login)      │  │  │History  │ │                               │
│   └──────────────┘  │  │Profile  │ │                               │
│                     │  │Recommend│ │                               │
│                     │  └─────────┘ │                               │
│                     └──────────────┘                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS / JSON  (Vite proxy → :5000)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FLASK REST API  (:5000)                          │
│                                                                     │
│  /api/auth/*     /api/analysis/*    /api/recommendations/*          │
│  /api/profile/*  /api/products/*    /api/report/*   /api/chat/*     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    @require_auth  (JWT)                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────┬──────────────┬──────────────────┬────────────────┬───────────┘
       │              │                  │                │
       ▼              ▼                  ▼                ▼
┌────────────┐ ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐
│  Supabase  │ │   MongoDB   │ │  AI Pipeline │ │  Groq API        │
│  Auth      │ │  (local)    │ │              │ │  llama-3.1-8b    │
│            │ │             │ │  Preprocessor│ │  (skincare chat) │
│  Users &   │ │  users      │ │  → MTCNN /   │ └──────────────────┘
│  passwords │ │  analyses   │ │    OpenCV    │
│            │ │  products   │ │  → CNN       │
│  Storage   │ │  sessions   │ │    Classifier│
│  Buckets:  │ └─────────────┘ │  → Recommender│
│  skin-imgs │                 └──────────────┘
│  reports   │
└────────────┘
```

---

## Layer Breakdown

### 1. Frontend (React + Vite)

```
frontend/src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router + context providers
├── apiClient.ts                # Axios — auto-attaches JWT
├── context/
│   ├── AuthContext.tsx          # User session state
│   └── AnalysisContext.tsx      # Analysis + history state
├── pages/
│   └── AuthPages.tsx            # Login + 3-step registration
└── components/
    ├── Dashboard.tsx            # Main app shell (tabs)
    ├── ImageCapture.tsx         # Upload / webcam → submit
    ├── AnalysisDetail.tsx       # Results + bounding boxes
    ├── RecommendationCard.tsx   # Product card
    ├── ProfileEditor.tsx        # Edit skin profile
    ├── ReportViewer.tsx         # PDF download trigger
    └── ChatBot.tsx              # Floating AI chat bubble
```

### 2. Flask API (Python)

```
backend/
├── app.py                      # App factory + blueprint registration
├── glowai/
│   ├── auth/
│   │   ├── service.py          # JWT, bcrypt, Supabase auth calls
│   │   ├── routes.py           # /api/auth/* endpoints
│   │   ├── decorators.py       # @require_auth
│   │   └── oauth.py            # Google OAuth flow
│   ├── api/
│   │   ├── analysis_bp.py      # POST /submit, GET /history
│   │   ├── recommendation_bp.py
│   │   ├── profile_bp.py
│   │   ├── product_bp.py
│   │   ├── report_bp.py        # PDF download
│   │   └── chat_bp.py          # Groq chatbot
│   ├── pipeline/
│   │   ├── preprocessor.py     # Resize 224×224, normalize, blur QC
│   │   ├── face_detector.py    # MTCNN → 4 face regions
│   │   ├── cnn_classifier.py   # Skin type + condition detection
│   │   └── recommender.py      # Hybrid content + CF scoring
│   ├── models/
│   │   ├── user.py             # MongoDB user CRUD
│   │   ├── analysis.py         # Analysis persistence
│   │   ├── product.py          # Product catalog
│   │   └── session.py          # JWT session tracking
│   ├── reports/
│   │   └── generator.py        # ReportLab PDF builder
│   ├── supabase_auth.py        # Supabase Auth (register/login)
│   ├── supabase_storage.py     # Supabase Storage (images/PDFs)
│   └── db.py                   # PyMongo client + indexes
```

### 3. Data Flow — Skin Analysis Request

```
User uploads photo
       │
       ▼
ImageCapture.tsx  ──POST /api/analysis/submit──►  analysis_bp.py
                                                        │
                                              ┌─────────▼──────────┐
                                              │  _validate_image()  │
                                              │  format/size/res    │
                                              └─────────┬──────────┘
                                                        │
                                              ┌─────────▼──────────┐
                                              │  _store_image()     │
                                              │  → Supabase Storage │
                                              └─────────┬──────────┘
                                                        │
                                              ┌─────────▼──────────┐
                                              │  preprocessor.py   │
                                              │  blur QC → 224×224 │
                                              │  normalize [0,1]   │
                                              └─────────┬──────────┘
                                                        │
                                              ┌─────────▼──────────┐
                                              │  face_detector.py  │
                                              │  MTCNN → 4 regions │
                                              │  forehead/cheeks/  │
                                              │  chin bboxes       │
                                              └─────────┬──────────┘
                                                        │
                                              ┌─────────▼──────────┐
                                              │  cnn_classifier.py │
                                              │  skin type (5 cls) │
                                              │  conditions (4 cls)│
                                              │  confidence scores │
                                              └─────────┬──────────┘
                                                        │
                                              ┌─────────▼──────────┐
                                              │  recommender.py    │
                                              │  allergen filter   │
                                              │  content score 70% │
                                              │  CF score 30%      │
                                              │  top-10 products   │
                                              └─────────┬──────────┘
                                                        │
                                              ┌─────────▼──────────┐
                                              │  save_analysis()   │
                                              │  → MongoDB         │
                                              └─────────┬──────────┘
                                                        │
                                                   JSON response
                                                        │
                                                        ▼
                                              Dashboard.tsx renders
                                              results + recommendations
```

### 4. Auth Flow

```
Register                              Login
   │                                    │
   ▼                                    ▼
validate_step (1,2,3)           supabase_login()
   │                                    │
   ▼                                    ▼
supabase_register()             verify credentials
(admin API, auto-confirm)       in Supabase Auth
   │                                    │
   ▼                                    ▼
create_user() → MongoDB         find_by_email() → MongoDB
   │                                    │
   ▼                                    ▼
issue_jwt() + create_session()  issue_jwt() + create_session()
   │                                    │
   ▼                                    ▼
{ token, user } → frontend      { token, user } → frontend
```

### 5. External Services

| Service | Purpose | SDK |
|---|---|---|
| Supabase Auth | User credentials (email + password) | `supabase-py` |
| Supabase Storage | Skin images + PDF reports | `supabase-py` |
| MongoDB (local) | User profiles, analyses, products, sessions | `pymongo` |
| Groq API | AI skincare chatbot (llama-3.1-8b-instant) | `groq` |
| MTCNN / OpenCV | Face detection + region segmentation | `mtcnn`, `opencv-python` |
| TensorFlow/Keras | CNN skin classifier (mock in dev) | `tensorflow` |
| ReportLab | PDF report generation | `reportlab` |

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Axios, React Router |
| Backend | Python 3.12, Flask, Flask-CORS |
| Auth | Supabase Auth + JWT (PyJWT) + bcrypt |
| Database | MongoDB (PyMongo) |
| File Storage | Supabase Storage |
| AI / CV | OpenCV, MTCNN, TensorFlow/Keras (CNN) |
| Chatbot | Groq API — llama-3.1-8b-instant |
| PDF | ReportLab |
| Dev Tools | Vite proxy, Flask debug mode, python-dotenv |
