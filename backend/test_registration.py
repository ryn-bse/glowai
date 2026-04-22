#!/usr/bin/env python3
"""
Test script to debug registration issues.
Run this to verify Supabase Auth is working correctly.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_env_vars():
    """Check if all required environment variables are set."""
    print("=" * 80)
    print("ENVIRONMENT VARIABLES CHECK")
    print("=" * 80)
    
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY", 
        "SUPABASE_SERVICE_KEY",
        "DATABASE_URL",
        "JWT_SECRET"
    ]
    
    missing = []
    for var in required_vars:
        value = os.environ.get(var, "")
        if value:
            # Show first 20 chars only for security
            display = value[:20] + "..." if len(value) > 20 else value
            print(f"✓ {var}: {display}")
        else:
            print(f"✗ {var}: NOT SET")
            missing.append(var)
    
    if missing:
        print(f"\n❌ Missing variables: {', '.join(missing)}")
        return False
    else:
        print("\n✓ All required environment variables are set")
        return True


def test_supabase_connection():
    """Test Supabase Auth connection."""
    print("\n" + "=" * 80)
    print("SUPABASE AUTH CONNECTION TEST")
    print("=" * 80)
    
    try:
        from glowai.supabase_auth import get_auth_client, is_configured
        
        if not is_configured():
            print("❌ Supabase is not configured")
            return False
        
        print("✓ Supabase configuration found")
        
        # Try to get client
        client = get_auth_client()
        print("✓ Supabase client created successfully")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_registration():
    """Test user registration with a dummy account."""
    print("\n" + "=" * 80)
    print("REGISTRATION TEST")
    print("=" * 80)
    
    test_email = f"test_{os.urandom(4).hex()}@example.com"
    test_password = "TestPassword123!"
    
    print(f"Testing registration with: {test_email}")
    
    try:
        from glowai.supabase_auth import supabase_register
        
        result = supabase_register(test_email, test_password)
        print(f"✓ Registration successful!")
        print(f"  User ID: {result.get('id')}")
        print(f"  Email: {result.get('email')}")
        return True
    except ValueError as e:
        print(f"❌ Registration failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("\n🔍 GlowAI Registration Debug Tool\n")
    
    # Test 1: Environment variables
    env_ok = test_env_vars()
    if not env_ok:
        print("\n⚠️  Fix environment variables before proceeding")
        sys.exit(1)
    
    # Test 2: Supabase connection
    conn_ok = test_supabase_connection()
    if not conn_ok:
        print("\n⚠️  Fix Supabase connection before proceeding")
        sys.exit(1)
    
    # Test 3: Registration
    reg_ok = test_registration()
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Environment Variables: {'✓ PASS' if env_ok else '✗ FAIL'}")
    print(f"Supabase Connection:   {'✓ PASS' if conn_ok else '✗ FAIL'}")
    print(f"Registration Test:     {'✓ PASS' if reg_ok else '✗ FAIL'}")
    
    if env_ok and conn_ok and reg_ok:
        print("\n✅ All tests passed! Registration should work.")
    else:
        print("\n❌ Some tests failed. Check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
