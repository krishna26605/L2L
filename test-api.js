const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  displayName: 'Test User',
  role: 'donor'
};

const testDonation = {
  title: 'Test Food Donation',
  description: 'This is a test donation for testing purposes',
  quantity: '5 plates',
  foodType: 'Cooked Food',
  expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  pickupWindow: {
    start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours from now
  },
  location: {
    address: '123 Test Street, Test City',
    lat: 40.7128,
    lng: -74.0060
  }
};

let authToken = '';
let userId = '';
let donationId = '';

async function testAPI() {
  console.log('🧪 Starting API Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('');

    // Test 2: Register User
    console.log('2. Testing User Registration...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
      authToken = registerResponse.data.token;
      userId = registerResponse.data.user._id;
      console.log('✅ User Registration:', registerResponse.data.user.email);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
        console.log('ℹ️  User already exists, trying login...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        authToken = loginResponse.data.token;
        userId = loginResponse.data.user._id;
        console.log('✅ User Login:', loginResponse.data.user.email);
      } else {
        throw error;
      }
    }
    console.log('');

    // Test 3: Get Profile
    console.log('3. Testing Get Profile...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get Profile:', profileResponse.data.user.displayName);
    console.log('');

    // Test 4: Create Donation
    console.log('4. Testing Create Donation...');
    const donationResponse = await axios.post(`${API_BASE_URL}/donations`, testDonation, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    donationId = donationResponse.data.donation._id;
    console.log('✅ Create Donation:', donationResponse.data.donation.title);
    console.log('');

    // Test 5: Get All Donations
    console.log('5. Testing Get All Donations...');
    const donationsResponse = await axios.get(`${API_BASE_URL}/donations`);
    console.log('✅ Get All Donations:', donationsResponse.data.donations.length, 'donations found');
    console.log('');

    // Test 6: Get Donation by ID
    console.log('6. Testing Get Donation by ID...');
    const donationByIdResponse = await axios.get(`${API_BASE_URL}/donations/${donationId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get Donation by ID:', donationByIdResponse.data.donation.title);
    console.log('');

    // Test 7: Get Donation Stats
    console.log('7. Testing Get Donation Stats...');
    const statsResponse = await axios.get(`${API_BASE_URL}/donations/stats`);
    console.log('✅ Get Donation Stats:', statsResponse.data.stats);
    console.log('');

    // Test 8: Get User Stats
    console.log('8. Testing Get User Stats...');
    const userStatsResponse = await axios.get(`${API_BASE_URL}/auth/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get User Stats:', userStatsResponse.data.stats);
    console.log('');

    // Test 9: Update Donation
    console.log('9. Testing Update Donation...');
    const updateData = { title: 'Updated Test Food Donation' };
    const updateResponse = await axios.put(`${API_BASE_URL}/donations/${donationId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Update Donation:', updateResponse.data.donation.title);
    console.log('');

    // Test 10: Delete Donation
    console.log('10. Testing Delete Donation...');
    const deleteResponse = await axios.delete(`${API_BASE_URL}/donations/${donationId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Delete Donation:', deleteResponse.data.message);
    console.log('');

    console.log('🎉 All API tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Run the tests
testAPI();
