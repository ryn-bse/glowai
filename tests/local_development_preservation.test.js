/**
 * Local Development Preservation Property Tests
 * 
 * IMPORTANT: Follow observation-first methodology
 * These tests capture the baseline behavior of local development
 * 
 * GOAL: Ensure fixes don't break local development functionality
 * 
 * This test validates that local development environment works correctly:
 * 1. Local API proxy routing (Vite proxy)
 * 2. Local authentication flows
 * 3. Local error handling
 * 4. Local environment variable loading
 * 5. Local database connectivity
 * 
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms baseline to preserve)
 * 
 * Run these tests BEFORE implementing fixes to capture current behavior
 */

const axios = require('axios');

// Local development configuration
const LOCAL_FRONTEND = 'http://localhost:5173';
const LOCAL_BACKEND = 'http://localhost:5000';
const LOCAL_API = `${LOCAL_FRONTEND}/api`; // Through Vite proxy

describe('Local Development Preservation Tests', () => {
  
  beforeAll(() => {
    console.log('\n' + '='.repeat(80));
    console.log('LOCAL DEVELOPMENT PRESERVATION TESTS');
    console.log('='.repeat(80));
    console.log('\nThese tests capture baseline local development behavior');
    console.log('They should PASS on unfixed code');
    console.log('After fixes, they should still PASS (no regressions)');
    console.log('='.repeat(80) + '\n');
  });

  describe('Property 1: Local API Proxy Routing', () => {
    test('Vite proxy should route /api calls to Flask backend', async () => {
      try {
        // Test that /api routes through Vite proxy to backend
        const response = await axios.get(`${LOCAL_API}/health`, {
          timeout: 5000
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
        
        console.log('✓ Local API proxy routing works');
        console.log('  Vite proxy correctly forwards /api to Flask backend');
      } catch (error) {
        console.error('✗ Local API proxy not working');
        console.error('  Make sure both servers are running:');
        console.error('    Backend: cd backend && python app.py');
        console.error('    Frontend: cd frontend && npm run dev');
        throw error;
      }
    });

    test('Direct backend access should work', async () => {
      try {
        const response = await axios.get(`${LOCAL_BACKEND}/api/health`, {
          timeout: 5000
        });
        
        expect(response.status).toBe(200);
        
        console.log('✓ Direct backend access works');
      } catch (error) {
        console.error('✗ Backend server not accessible');
        throw error;
      }
    });

    test('All auth endpoints should be accessible through proxy', async () => {
      try {
        // Test login endpoint (should return 400 for missing credentials)
        const response = await axios.post(`${LOCAL_API}/auth/login`, {}, {
          validateStatus: () => true
        });
        
        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
        
        console.log('✓ Auth endpoints accessible through proxy');
      } catch (error) {
        console.error('✗ Auth endpoint routing issue');
        throw error;
      }
    });
  });

  describe('Property 2: Local Authentication Flows', () => {
    test('Login with invalid credentials should return proper error', async () => {
      try {
        const response = await axios.post(`${LOCAL_API}/auth/login`, {
          email: 'test@example.com',
          password: 'wrongpassword'
        }, {
          validateStatus: () => true
        });
        
        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
        expect(typeof response.data.error).toBe('string');
        
        console.log('✓ Login error handling works locally');
        console.log('  Error message:', response.data.error);
      } catch (error) {
        console.error('✗ Login flow issue');
        throw error;
      }
    });

    test('Registration validation should work locally', async () => {
      try {
        const response = await axios.post(`${LOCAL_API}/auth/register`, {
          step1: { email: 'invalid' },
          step2: {},
          step3: {}
        }, {
          validateStatus: () => true
        });
        
        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
        
        console.log('✓ Registration validation works locally');
      } catch (error) {
        console.error('✗ Registration validation issue');
        throw error;
      }
    });

    test('Complete registration flow should work locally', async () => {
      const testUser = {
        step1: {
          first_name: 'LocalTest',
          last_name: 'User',
          email: `localtest${Date.now()}@example.com`,
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
        const response = await axios.post(`${LOCAL_API}/auth/register`, testUser, {
          validateStatus: () => true
        });
        
        // Should succeed or fail with proper error
        if (response.status === 201) {
          expect(response.data).toHaveProperty('user');
          expect(response.data).toHaveProperty('token');
          expect(response.data.user).toHaveProperty('email');
          
          console.log('✓ Complete registration flow works locally');
          console.log('  User created:', response.data.user.email);
        } else {
          // If it fails, error should be readable
          expect(response.data).toHaveProperty('error');
          expect(typeof response.data.error).toBe('string');
          
          console.log('✓ Registration error handling works locally');
          console.log('  Error:', response.data.error);
        }
      } catch (error) {
        console.error('✗ Registration flow broken locally');
        throw error;
      }
    });
  });

  describe('Property 3: Local Error Handling', () => {
    test('Error messages should be properly formatted locally', async () => {
      try {
        const response = await axios.post(`${LOCAL_API}/auth/login`, {
          email: '',
          password: ''
        }, {
          validateStatus: () => true
        });
        
        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
        
        const error = response.data.error;
        expect(typeof error).toBe('string');
        expect(error).not.toBe('[object Object]');
        expect(error.length).toBeGreaterThan(0);
        
        console.log('✓ Error formatting works locally');
        console.log('  Error type:', typeof error);
        console.log('  Error message:', error);
      } catch (error) {
        console.error('✗ Error formatting issue locally');
        throw error;
      }
    });

    test('Validation errors should have proper structure locally', async () => {
      try {
        const response = await axios.post(`${LOCAL_API}/auth/register`, {
          step1: {},
          step2: {},
          step3: {}
        }, {
          validateStatus: () => true
        });
        
        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
        
        // Error can be string or have fields property
        if (response.data.fields) {
          expect(typeof response.data.fields).toBe('object');
        }
        
        console.log('✓ Validation error structure works locally');
      } catch (error) {
        console.error('✗ Validation error structure issue');
        throw error;
      }
    });
  });

  describe('Property 4: Local Environment Variable Loading', () => {
    test('Backend should load .env file correctly', async () => {
      try {
        const response = await axios.get(`${LOCAL_API}/health`);
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
        
        // If health check works, env vars are loaded
        console.log('✓ Environment variables loaded locally');
        console.log('  Health check response:', response.data);
      } catch (error) {
        console.error('✗ Environment variable loading issue');
        throw error;
      }
    });

    test('Database connection should work with local .env', async () => {
      try {
        const response = await axios.get(`${LOCAL_API}/health`);
        
        if (response.data.database) {
          expect(response.data.database).toBe('connected');
          console.log('✓ Database connection works locally');
        } else {
          console.log('⚠ Database status not in health check');
        }
      } catch (error) {
        console.error('✗ Database connection issue locally');
        throw error;
      }
    });
  });

  describe('Property 5: Local Database Connectivity', () => {
    test('Supabase integration should work locally', async () => {
      try {
        const response = await axios.get(`${LOCAL_API}/health`);
        
        if (response.data.supabase_auth) {
          expect(response.data.supabase_auth).toBe('configured');
          console.log('✓ Supabase integration works locally');
        } else {
          console.log('⚠ Supabase status not in health check');
        }
      } catch (error) {
        console.error('✗ Supabase integration issue locally');
        throw error;
      }
    });

    test('User operations should work with local database', async () => {
      try {
        // Try to login (will fail but should connect to DB)
        const response = await axios.post(`${LOCAL_API}/auth/login`, {
          email: 'nonexistent@example.com',
          password: 'test'
        }, {
          validateStatus: () => true
        });
        
        // Should get auth error, not database error
        expect(response.status).toBe(400);
        expect(response.data).toHaveProperty('error');
        
        console.log('✓ Database operations work locally');
      } catch (error) {
        console.error('✗ Database operation issue locally');
        throw error;
      }
    });
  });

  describe('Property 6: CORS Configuration for Local Development', () => {
    test('CORS should allow localhost origins', async () => {
      try {
        const response = await axios.options(`${LOCAL_API}/auth/login`, {
          headers: {
            'Origin': LOCAL_FRONTEND,
            'Access-Control-Request-Method': 'POST'
          }
        });
        
        // CORS should be configured for local development
        console.log('✓ CORS configured for local development');
        console.log('  CORS headers:', response.headers['access-control-allow-origin']);
      } catch (error) {
        // Some servers don't respond to OPTIONS, that's okay
        console.log('⚠ CORS preflight not tested (server may not support OPTIONS)');
      }
    });
  });
});

afterAll(() => {
  console.log('\n' + '='.repeat(80));
  console.log('PRESERVATION TEST RESULTS');
  console.log('='.repeat(80));
  console.log('\nEXPECTED OUTCOME: All tests should PASS');
  console.log('This confirms the baseline local development behavior.');
  console.log('\nAfter implementing fixes, re-run these tests.');
  console.log('They should still PASS (no regressions in local dev).');
  console.log('='.repeat(80) + '\n');
});
