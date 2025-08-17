// Test script for Dashboard API endpoints
// Run with: node test-dashboard-api.js

const BASE_URL = 'http://localhost:5000/api/dashboard';

// Test user ID (replace with actual user ID from your database)
const TEST_USER_ID = '64f8a1b2c3d4e5f6a7b8c9d0';

// Test data for different components
const testData = {
  information: {
    companyName: "Test Corporation",
    companyType: "Private Limited",
    industry: "Technology",
    foundedYear: 2020,
    employeeCount: 100,
    headquarters: "Mumbai, India",
    website: "https://testcorp.com",
    description: "A test company for API testing",
    contactInfo: {
      email: "test@testcorp.com",
      phone: "+91-22-12345678",
      address: "123 Test Street, Mumbai"
    }
  },
  
  overview: {
    businessOverview: "Test business overview description",
    revenueStreams: "Test revenue streams description",
    industryOverview: "Test industry overview description",
    fundUtilization: "Test fund utilization description",
    aboutPromoters: "Test promoters description",
    riskFactors: "Test risk factors description",
    ipoIntermediaries: "Test intermediaries description",
    financialHighlights: {
      revenue: { fy22: 100.5, fy23: 120.3, fy24: 135.7, sept24: 45.2 },
      ebitda: { fy22: 20.1, fy23: 24.1, fy24: 27.1, sept24: 9.0 },
      pat: { fy22: 15.1, fy23: 18.1, fy24: 20.3, sept24: 6.8 }
    },
    peerAnalysis: {
      companyNames: ["Peer Company A", "Peer Company B"],
      revenue: [150.2, 180.5],
      basicEps: [25.5, 30.2]
    },
    shareholding: {
      promoters: { shares: 1000000, percentage: 60.5 },
      public: { shares: 650000, percentage: 39.5 }
    }
  },
  
  beneficialOwnerCertification: {
    owners: [
      {
        name: "Test Owner",
        nationality: "Indian",
        passportNumber: "A12345678",
        dateOfBirth: "1980-05-15",
        residentialAddress: "123 Test Address, Mumbai",
        percentageOwnership: 45.5,
        sourceOfFunds: "Business earnings"
      }
    ],
    certificationDate: new Date().toISOString(),
    isCertified: true
  },
  
  companyReferences: {
    references: [
      {
        companyName: "Reference Corp",
        contactPerson: "Test Contact",
        position: "CEO",
        email: "test@referencecorp.com",
        phone: "+91-22-87654321",
        relationship: "Business Partner",
        yearsOfRelationship: 5,
        description: "Test business relationship"
      }
    ]
  },
  
  ddform: {
    businessDetails: {
      legalStructure: "Private Limited",
      registrationNumber: "U12345MH2020PTC123456",
      taxIdentification: "27AABCT1234D1Z5",
      businessLicense: "BL123456789"
    },
    financialInformation: {
      annualRevenue: 50000000,
      profitMargin: 15.5,
      debtRatio: 0.3,
      cashFlow: 7500000
    },
    compliance: {
      regulatoryCompliance: true,
      environmentalCompliance: true,
      laborCompliance: true,
      taxCompliance: true
    },
    riskAssessment: {
      marketRisk: "Medium",
      operationalRisk: "Low",
      financialRisk: "Medium",
      complianceRisk: "Low"
    }
  },
  
  loanDetails: {
    loanType: "Term Loan",
    amount: 10000000,
    currency: "INR",
    interestRate: 12.5,
    term: 60,
    purpose: "Working capital",
    collateral: {
      type: "Property",
      value: 15000000,
      description: "Test commercial property"
    },
    repaymentSchedule: {
      frequency: "Monthly",
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    guarantors: [
      {
        name: "Test Guarantor",
        relationship: "Director",
        netWorth: 50000000,
        contactInfo: {
          email: "guarantor@test.com",
          phone: "+91-22-11111111"
        }
      }
    ]
  }
};

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test functions
async function testGetDashboardData() {
  console.log('\n1. Testing GET Dashboard Data...');
  const result = await makeRequest(`${BASE_URL}/${TEST_USER_ID}`);
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.status === 200;
}

async function testSaveInformation() {
  console.log('\n2. Testing Save Information...');
  const result = await makeRequest(`${BASE_URL}/${TEST_USER_ID}/information`, {
    method: 'POST',
    body: JSON.stringify(testData.information)
  });
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.status === 200;
}

async function testSaveOverview() {
  console.log('\n3. Testing Save Overview...');
  const result = await makeRequest(`${BASE_URL}/${TEST_USER_ID}/overview`, {
    method: 'POST',
    body: JSON.stringify(testData.overview)
  });
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.status === 200;
}

async function testSaveBeneficialOwner() {
  console.log('\n4. Testing Save Beneficial Owner...');
  const result = await makeRequest(`${BASE_URL}/${TEST_USER_ID}/beneficial-owner`, {
    method: 'POST',
    body: JSON.stringify(testData.beneficialOwnerCertification)
  });
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.status === 200;
}

async function testSaveCompanyReferences() {
  console.log('\n5. Testing Save Company References...');
  const result = await makeRequest(`${BASE_URL}/${TEST_USER_ID}/company-references`, {
    method: 'POST',
    body: JSON.stringify(testData.companyReferences)
  });
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.status === 200;
}

async function testSaveDDForm() {
  console.log('\n6. Testing Save DD Form...');
  const result = await makeRequest(`${BASE_URL}/${TEST_USER_ID}/ddform`, {
    method: 'POST',
    body: JSON.stringify(testData.ddform)
  });
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.status === 200;
}

async function testSaveLoanDetails() {
  console.log('\n7. Testing Save Loan Details...');
  const result = await makeRequest(`${BASE_URL}/${TEST_USER_ID}/loan-details`, {
    method: 'POST',
    body: JSON.stringify(testData.loanDetails)
  });
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.status === 200;
}

async function testGetCompletionStatus() {
  console.log('\n8. Testing Get Completion Status...');
  const result = await makeRequest(`${BASE_URL}/${TEST_USER_ID}/completion-status`);
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.status === 200;
}

async function testGenericComponentSave() {
  console.log('\n9. Testing Generic Component Save...');
  const result = await makeRequest(`${BASE_URL}/${TEST_USER_ID}/component/information`, {
    method: 'POST',
    body: JSON.stringify(testData.information)
  });
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.status === 200;
}

async function testGetUpdatedDashboardData() {
  console.log('\n10. Testing Get Updated Dashboard Data...');
  const result = await makeRequest(`${BASE_URL}/${TEST_USER_ID}`);
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.status === 200;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Dashboard API Tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  
  const tests = [
    { name: 'Get Dashboard Data', fn: testGetDashboardData },
    { name: 'Save Information', fn: testSaveInformation },
    { name: 'Save Overview', fn: testSaveOverview },
    { name: 'Save Beneficial Owner', fn: testSaveBeneficialOwner },
    { name: 'Save Company References', fn: testSaveCompanyReferences },
    { name: 'Save DD Form', fn: testSaveDDForm },
    { name: 'Save Loan Details', fn: testSaveLoanDetails },
    { name: 'Get Completion Status', fn: testGetCompletionStatus },
    { name: 'Generic Component Save', fn: testGenericComponentSave },
    { name: 'Get Updated Dashboard Data', fn: testGetUpdatedDashboardData }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const success = await test.fn();
      if (success) {
        console.log(`✅ ${test.name}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Dashboard API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the API implementation.');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testData }; 