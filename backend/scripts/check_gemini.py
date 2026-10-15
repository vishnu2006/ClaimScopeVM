#!/usr/bin/env python3
"""
ClaimScope — Gemini API Diagnostic & Connectivity Utility
Checks environment configuration and validates connection with Google Gemini without exposing credentials.
"""

import os
import sys

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings


def main():
    print("=" * 65)
    print("  ClaimScope — Google Gemini Connectivity Diagnostic")
    print("=" * 65)

    print(f"\n[1] Application Config:")
    print(f"    - App Name:        {settings.APP_NAME} (v{settings.APP_VERSION})")
    print(f"    - Configured Model:{settings.GEMINI_MODEL}")
    print(f"    - Database URL:    {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")

    key = settings.GEMINI_API_KEY
    if not key or not key.strip():
        print("\n[!] GEMINI_API_KEY Status: NOT CONFIGURED")
        print("\n    To activate live Gemini multimodal extraction & vision:")
        print("    1. Open backend/.env")
        print("    2. Add: GEMINI_API_KEY=\"AIzaSy...your-gemini-key\"")
        print("    3. Save and re-run this script:")
        print("       python backend/scripts/check_gemini.py")
        print("\n" + "=" * 65)
        sys.exit(0)

    key_clean = key.strip()
    masked = f"{key_clean[:6]}...{key_clean[-4:]}" if len(key_clean) > 10 else "***masked***"
    print(f"\n[2] API Key Detected:")
    print(f"    - Key Fingerprint: {masked} (length: {len(key_clean)} chars)")

    print(f"\n[3] Testing Gemini Handshake ({settings.GEMINI_MODEL})...")
    try:
        from google import genai
        client = genai.Client(api_key=key_clean)
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents="Hello! Please reply with exactly: 'Gemini connectivity established successfully.'",
        )
        reply = response.text.strip() if hasattr(response, "text") and response.text else "OK"
        print(f"    ✓ Connection SUCCESSFUL!")
        print(f"    - Response: \"{reply}\"")
        print("\n" + "=" * 65)
        print("  All multimodal AI capabilities are fully active.")
        print("=" * 65)
    except Exception as exc:
        print(f"    ✗ Connection FAILED!")
        print(f"    - Error: {exc}")
        print("\n    Please verify that your GEMINI_API_KEY is valid and has active API quota.")
        print("=" * 65)
        sys.exit(1)


if __name__ == "__main__":
    main()
