#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

console.log('🧪 Testing Trade App API...');
console.log(`API Base URL: ${API_BASE_URL}\n`);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'TradeApp-Test/1.0.0'
  }
});

// 测试用例
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    url: '/health',
    expectedStatus: 200
  },
  {
    name: 'Market Status',
    method: 'GET',
    url: '/market/status',
    expectedStatus: 200
  },
  {
    name: 'Market Indices',
    method: 'GET',
    url: '/market/indices',
    expectedStatus: 200
  },
  {
    name: 'Hot Stocks',
    method: 'GET',
    url: '/market/hot-stocks',
    expectedStatus: 200
  },
  {
    name: 'Market Capital Flow',
    method: 'GET',
    url: '/market/capital-flow',
    expectedStatus: 200
  },
  {
    name: 'Market Sentiment',
    method: 'GET',
    url: '/market/sentiment',
    expectedStatus: 200
  },
  {
    name: 'Market Overview',
    method: 'GET',
    url: '/market/overview',
    expectedStatus: 200
  },
  {
    name: 'Market Ranking',
    method: 'GET',
    url: '/market/ranking?type=gain&period=day',
    expectedStatus: 200
  },
  {
    name: 'Market News',
    method: 'GET',
    url: '/market/news',
    expectedStatus: 200
  },
  {
    name: 'Market Sectors',
    method: 'GET',
    url: '/market/sectors',
    expectedStatus: 200
  },
  {
    name: 'Market Concepts',
    method: 'GET',
    url: '/market/concepts',
    expectedStatus: 200
  },
  {
    name: 'Market Calendar',
    method: 'GET',
    url: '/market/calendar',
    expectedStatus: 200
  },
  {
    name: 'Market Economic Calendar',
    method: 'GET',
    url: '/market/economic-calendar',
    expectedStatus: 200
  },
  {
    name: 'Market Trends',
    method: 'GET',
    url: '/market/trends',
    expectedStatus: 200
  },
  {
    name: 'Market Analysis',
    method: 'GET',
    url: '/market/analysis',
    expectedStatus: 200
  },
  {
    name: 'Market Alerts',
    method: 'GET',
    url: '/market/alerts',
    expectedStatus: 200
  },
  {
    name: 'Market Statistics',
    method: 'GET',
    url: '/market/statistics',
    expectedStatus: 200
  }
];

async function runTest(test) {
  try {
    console.log(`🔍 Testing: ${test.name}`);
    
    const response = await apiClient.request({
      method: test.method,
      url: test.url
    });
    
    if (response.status === test.expectedStatus) {
      console.log(`✅ ${test.name}: PASSED (${response.status})`);
      
      // 检查响应格式
      if (response.data && typeof response.data === 'object') {
        if (response.data.code !== undefined) {
          console.log(`   Response Code: ${response.data.code}`);
        }
        if (response.data.message) {
          console.log(`   Message: ${response.data.message}`);
        }
        if (response.data.data) {
          console.log(`   Data Type: ${Array.isArray(response.data.data) ? 'Array' : 'Object'}`);
        }
      }
    } else {
      console.log(`❌ ${test.name}: FAILED (Expected: ${test.expectedStatus}, Got: ${response.status})`);
    }
  } catch (error) {
    console.log(`❌ ${test.name}: ERROR`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || error.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log('');
}

async function runAllTests() {
  console.log('🚀 Starting API tests...\n');
  
  for (const test of tests) {
    await runTest(test);
    // 添加小延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('🏁 API tests completed!');
}

// 运行测试
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
}); 