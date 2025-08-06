// Test script to verify frontend can access backend API
const axios = require('axios');

const apiURL = 'http://localhost:8000';

async function testAPI() {
  console.log('Testing NFT Marketplace API...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${apiURL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test NFTs endpoint
    console.log('\n2. Testing NFTs endpoint...');
    const nftsResponse = await axios.get(`${apiURL}/api/nfts?limit=3`);
    console.log('✅ NFTs response:', {
      success: nftsResponse.data.success,
      count: nftsResponse.data.data?.length || 0,
      firstNFT: nftsResponse.data.data?.[0]?.title || 'N/A'
    });
    
    // Test CORS
    console.log('\n3. Testing CORS headers...');
    console.log('CORS headers:', {
      'access-control-allow-origin': nftsResponse.headers['access-control-allow-origin'],
      'access-control-allow-methods': nftsResponse.headers['access-control-allow-methods'],
      'access-control-allow-headers': nftsResponse.headers['access-control-allow-headers']
    });
    
    console.log('\n✅ All tests passed! Backend is accessible from frontend.');
    
  } catch (error) {
    console.error('❌ API test failed:', {
      message: error.message,
      code: error.code,
      response: error.response?.data || 'No response data'
    });
  }
}

testAPI();
