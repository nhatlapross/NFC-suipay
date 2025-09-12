const request = require('supertest');
const app = require('./dist/app.js'); // Assuming app export

// Mock authentication middleware for testing
const mockAuthMiddleware = (req, res, next) => {
  req.user = {
    id: 'test-admin-id',
    email: 'admin@test.com',
    role: 'admin'
  };
  next();
};

// Test admin controller endpoints
async function testAdminEndpoints() {
  console.log('🧪 Testing Admin Controller Endpoints...\n');

  try {
    // Test 1: Dashboard endpoint
    console.log('1️⃣ Testing GET /api/admin/dashboard');
    const dashboard = await request(app)
      .get('/api/admin/dashboard')
      .expect('Content-Type', /json/);
    
    console.log('Status:', dashboard.status);
    console.log('Response:', dashboard.body);

  } catch (error) {
    console.error('❌ Dashboard test failed:', error.message);
  }

  try {
    // Test 2: Health endpoint  
    console.log('\n2️⃣ Testing GET /api/admin/health');
    const health = await request(app)
      .get('/api/admin/health')
      .expect('Content-Type', /json/);
      
    console.log('Status:', health.status);
    console.log('Response:', health.body);

  } catch (error) {
    console.error('❌ Health test failed:', error.message);
  }

  try {
    // Test 3: System stats endpoint
    console.log('\n3️⃣ Testing GET /api/admin/stats');
    const stats = await request(app)
      .get('/api/admin/stats')
      .expect('Content-Type', /json/);
      
    console.log('Status:', stats.status);
    console.log('Response:', stats.body);

  } catch (error) {
    console.error('❌ Stats test failed:', error.message);
  }

  console.log('\n🎉 Admin Controller Tests Completed!');
}

// Run the tests
testAdminEndpoints().catch(console.error);