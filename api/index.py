"""
Vercel serverless entry point for GlowAI Flask backend.
Vercel looks for api/index.py and exposes it as a serverless function.
"""
import sys
import os

# Add backend directory to path so glowai package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import create_app

app = create_app()
