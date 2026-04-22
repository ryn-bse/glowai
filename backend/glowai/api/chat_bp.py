"""
AI Skincare Chatbot endpoint using Groq (llama3-8b-8192).
The bot is aware of the user's skin profile and latest analysis.
"""
import os
from flask import Blueprint, request, jsonify
from groq import Groq
from glowai.auth.decorators import require_auth
from glowai.models.analysis import get_history_for_user

chat_bp = Blueprint("chat", __name__)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.1-8b-instant"

SYSTEM_PROMPT = """You are GlowAI's expert skincare assistant. You are friendly, concise, and knowledgeable about dermatology and cosmetic products.

You have access to the user's skin profile and latest analysis results (provided in the conversation context). Use this information to give personalized advice.

Guidelines:
- Keep responses concise (2-4 sentences unless a detailed explanation is needed)
- Always relate advice back to the user's specific skin type and conditions when relevant
- Recommend product categories (not specific brands) unless asked
- Remind users that you are an AI and serious skin concerns should be seen by a dermatologist
- Never diagnose medical conditions
"""


def _build_context(user: dict) -> str:
    """Build a context string from the user's skin profile and latest analysis."""
    profile = user.get("skin_profile", {})
    skin_type = profile.get("skin_type", "unknown")
    concern = profile.get("primary_concern", "none")
    allergies = profile.get("known_allergies", [])

    # Get latest analysis
    history = get_history_for_user(str(user["_id"]))
    context_parts = [
        f"User skin type: {skin_type}",
        f"Primary concern: {concern}",
    ]
    if allergies:
        context_parts.append(f"Known allergies: {', '.join(allergies)}")

    if history:
        latest = history[0]
        conditions = [c.get("name", "").replace("_", " ") for c in latest.get("conditions", [])]
        if conditions:
            context_parts.append(f"Detected skin conditions: {', '.join(conditions)}")
        else:
            context_parts.append("Latest analysis: no significant conditions detected")

    return "\n".join(context_parts)


@chat_bp.route("/", methods=["POST"])
@require_auth
def chat():
    if not GROQ_API_KEY:
        return jsonify({"error": "Chatbot not configured. Set GROQ_API_KEY."}), 503

    data = request.get_json() or {}
    messages = data.get("messages", [])  # list of {role, content}
    if not messages:
        return jsonify({"error": "No messages provided."}), 400

    user = request.current_user
    user_context = _build_context(user)

    # Prepend user context to system prompt
    system_with_context = f"{SYSTEM_PROMPT}\n\nUser context:\n{user_context}"

    client = Groq(api_key=GROQ_API_KEY)

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_with_context},
                *messages[-10:],  # keep last 10 messages for context window
            ],
            max_tokens=512,
            temperature=0.7,
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply}), 200
    except Exception as e:
        return jsonify({"error": f"Chatbot error: {str(e)}"}), 500
