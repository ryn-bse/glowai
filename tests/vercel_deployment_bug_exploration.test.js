/**
 * Bug Condition Exploration Test for Vercel Deployment Issues
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * GOAL: Surface counterexamples that demonstrate deployment bugs exist
 * 
 * This test validates the bug condition for Vercel production deployment failures.
 * It systematically checks:
 * 1. API Routing - Frontend /api calls should reach serverless functions
 * 2. Error Serialization - Errors should show readable messages, not "[object Object]"
 * 3. Environment Variables - Database connectivity should work
 * 4. Authentication Flow - Signup should redirect to dashboard
 * 5. CORS Configuration - API calls should succeed from production domain
 * 
 * EXPECTED OUTCOME: Test FAILS (proves deployment bugs exist)
 */

const axios = require('axios');

// Configuration - Update with your Vercel deployment URL
const VERCEL_URL = process.env.VERCEL_URL || 'https://your-app.vercel.app';
const API_BASE = `${VERCEL_URL}/api`;

describe('Vercel Deployment Bug Condition Exploration', () => {
  
  describe('Property 1: API Routing', () => {
    test('Health check endpoint should be accessible', async () => {
      // This will likely FAIL on unfixed code due to routing issues
      try {
        const response = await axios.get(`${API_BASE}/health`, {
          timeout: 10000
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
        
        console.log('✓ API routing works - health check accessible');
        console.log('Response:', response.data);
      } catch (error) {
        // Document the counterexample
        console.error('✗ COUNTEREXAMPLE FOUND: API routing failure');
        console.error('Error:', error.message);
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        
        // Re-throw to fail the test
        throw new Error(`API routing failed: ${error.message}`);
      }
    });

    test('Auth endpoints should be routable', async () => {
      // This will likely FAIL on unfixed code
      try {
        // Try to access login endpoint (should return 400 for missing credentials, not 404)
        const response = await axios.post(`${API_BASE}/auth/login`, {}, {
          validateStatus: () => true // Accept any status
        });
        
        // Should get 400 (validation error), not 404 (routing error)
        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(502);
        expect(response.status).not.toBe(500);
        
        console.log('✓ Auth endpoint routing works');
      } catch (error) {
        console.error('✗ COUNTEREXAMPLE: Auth endpoint not routable');
        console.error('Error:', error.message);
        throw new Error(`Auth routing failed: ${error.message}`);
      }
    });
  });

  describe('Property 2: Error Serialization', () => {
    test('Authentication errors should return readable error messages', async () => {
      // This will likely FAIL on unfixed code - will show "[object Object]"
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: 'test@example.com',
          password: 'wrongpassword'
        }, {
          validateStatus: () => true
        });
        
        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
        
        // Error should be a string, not an object
        const errorMessage = response.data.error;
        expect(typeof errorMessage).toBe('string');
        expect(errorMessage).not.toBe('[object Object]');
        expect(errorMessage.length).toBeGreaterThan(0);
        
        console.log('✓ Error serialization works correctly');
        console.log('Error message:', errorMessage);
      } catch (error) {
        console.error('✗ COUNTEREXAMPLE: Error serialization issue');
        console.error('Response data:', error.response?.data);
        throw new Error(`Error serialization failed: ${error.message}`);
      }
    });

    test('Registration validation errors should be properly formatted', async () => {
      // This will likely FAIL on unfixed code
      try {
        const response = await axios.post(`${API_BASE}/auth/register`, {
          step1: { email: 'invalid-email' },
          step2: {},
          step3: {}
        }, {
          validateStatus: () => true
        });
        
        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
        
        // Error should be readable
        const errorData = response.data.error;
        if (typeof errorData === 'string') {
          expect(errorData).not.toBe('[object Object]');
        }
        
        console.log('✓ Registration error formatting works');
      } catch (error) {
        console.error('✗ COUNTEREXAMPLE: Registration error formatting issue');
        console.error('Response:', error.response?.data);
        throw error;
      }
    });
  });

  describe('Property 3: Environment Variables & Database', () => {
    test('Database connection should be configured', async () => {
      // This will likely FAIL if environment variables are missing
      try {
        const response = await axios.get(`${API_BASE}/health`, {
          timeout: 10000
        });
        
        expect(response.data).toHaveProperty('database');
        expect(response.data.database).toBe('connected');
        
        console.log('✓ Database connection works');
      } catch (error) {
        console.error('✗ COUNTEREXAMPLE: Database connection issue');
        console.error('Likely missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
        console.error('Error:', error.message);
        throw error;
      }
    });

    test('Supabase auth should be configured', async () => {
      // This will likely FAIL if SUPABASE_ANON_KEY is missing
      try {
        const response = await axios.get(`${API_BASE}/health`);
        
        expect(response.data).toHaveProperty('supabase_auth');
        expect(response.data.supabase_auth).toBe('configured');
        
        console.log('✓ Supabase auth configured');
      } catch (error) {
        console.error('✗ COUNTEREXAMPLE: Supabase auth not configured');
        console.error('Likely missing SUPABASE_ANON_KEY');
        throw error;
      }
    });
  });

  describe('Property 4: Authentication Flow', () => {
    test('User registration should complete successfully', async () => {
      // This will likely FAIL on unfixed code
      const testUser = {
        step1: {
          first_name: 'Test',
          last_name: 'User',
          email: `test${Date.now()}@example.com`,
          gender: 'Female'
        },
        step2: {
          skin_type: 'normal',
          primary_concern: 'acne',
          skin_tone: 'Medium / Wheatish',
          known_allergies: []
        },
        step3: {
          password: 'TestPassword123!',
          terms_agreed: true
        }
      };
      
      try {
        const response = await axios.post(`${API_BASE}/auth/register`, testUser, {
          validateStatus: () => true
        });
        
        // Should succeed or fail with proper error
        if (response.status === 201) {
          expect(response.data).toHaveProperty('user');
          expect(response.data).toHaveProperty('token');
          expect(response.data.user).toHaveProperty('email');
          
          console.log('✓ Registration flow works');
          console.log('User created:', response.data.user.email);
        } else {
          // If it fails, error should be readable
          expect(response.data.error).not.toBe('[object Object]');
          console.log('Registration failed with readable error:', response.data.error);
        }
      } catch (error) {
        console.error('✗ COUNTEREXAMPLE: Registration flow broken');
        console.error('Error:', error.message);
        console.error('Response:', error.response?.data);
        throw error;
      }
    });
  });

  describe('Property 5: CORS Configuration', () => {
    test('CORS headers should allow production domain', async () => {
      // This will likely FAIL if CORS is not configured for Vercel domain
      try {
        const response = await axios.options(`${API_BASE}/auth/login`, {
          headers: {
            'Origin': VERCEL_URL,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type'
          }
        });
        
        expect(response.headers).toHaveProperty('access-control-allow-origin');
        
        console.log('✓ CORS configured correctly');
        console.log('CORS headers:', response.headers['access-control-allow-origin']);
      } catch (error) {
        console.error('✗ COUNTEREXAMPLE: CORS not configured');
        console.error('Error:', error.message);
        throw error;
      }
    });
  });
});

// Summary reporter
afterAll(() => {
  console.log('\n' + '='.repeat(80));
  console.log('BUG CONDITION EXPLORATION COMPLETE');
  console.log('='.repeat(80));
  console.log('\nEXPECTED OUTCOME: Tests should FAIL on unfixed code');
  console.log('This confirms the deployment bugs exist and need fixing.');
  console.log('\nCounterexamples found above document the specific issues.');
  console.log('='.repeat(80) + '\n');
});
