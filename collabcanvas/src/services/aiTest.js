// src/services/aiTest.js
// Test file for AI Service Integration (PR #18)
// Run these tests in the browser console to verify AI is working

import { sendMessage, testConnection } from './ai';
import { canvasAPI } from './canvasAPI';

/**
 * Test 1: Verify OpenAI connection
 */
export async function test1_Connection() {
  console.log('\n=== TEST 1: OpenAI Connection ===');
  const result = await testConnection();
  console.log('Connection test result:', result ? '✅ PASS' : '❌ FAIL');
  return result;
}

/**
 * Test 2: Test Canvas API directly (no AI)
 */
export async function test2_CanvasAPI() {
  console.log('\n=== TEST 2: Canvas API ===');
  
  // Test rectangle creation (null userId = use current authenticated user)
  const rectResult = await canvasAPI.createRectangle(2400, 2400, 200, 150, '#FF0000', null);
  console.log('Rectangle creation:', rectResult.success ? '✅ PASS' : '❌ FAIL', rectResult);
  
  // Test validation (should fail)
  const invalidResult = await canvasAPI.createRectangle(-100, 2500, 200, 150, '#FF0000', null);
  console.log('Validation test:', !invalidResult.success ? '✅ PASS' : '❌ FAIL', invalidResult);
  
  // Test canvas center query
  const centerResult = await canvasAPI.getCanvasCenter();
  console.log('Get canvas center:', centerResult.success ? '✅ PASS' : '❌ FAIL', centerResult);
  
  return rectResult.success && !invalidResult.success && centerResult.success;
}

/**
 * Test 3: Test AI simple command
 */
export async function test3_AISimpleCommand() {
  console.log('\n=== TEST 3: AI Simple Command ===');
  
  const result = await sendMessage(
    [], 
    'Create a blue rectangle at position 2400, 2400 with size 200x150'
  );
  
  console.log('AI command result:', result.success ? '✅ PASS' : '❌ FAIL');
  console.log('Function called:', result.functionCalled);
  console.log('AI message:', result.message);
  console.log('Result:', result.functionResult);
  
  return result.success && result.functionCalled === 'createRectangle';
}

/**
 * Test 4: Test AI with natural language
 */
export async function test4_AINaturalLanguage() {
  console.log('\n=== TEST 4: AI Natural Language ===');
  
  const result = await sendMessage(
    [], 
    'Create a green circle at the center of the canvas with radius 75'
  );
  
  console.log('AI command result:', result.success ? '✅ PASS' : '❌ FAIL');
  console.log('Function called:', result.functionCalled);
  console.log('AI message:', result.message);
  console.log('Result:', result.functionResult);
  
  return result.success && result.functionCalled === 'createCircle';
}

/**
 * Test 5: Test AI query command
 */
export async function test5_AIQueryCommand() {
  console.log('\n=== TEST 5: AI Query Command ===');
  
  const result = await sendMessage(
    [], 
    'What shapes are currently on the canvas?'
  );
  
  console.log('AI command result:', result.success ? '✅ PASS' : '❌ FAIL');
  console.log('Function called:', result.functionCalled);
  console.log('AI message:', result.message);
  
  return result.success && result.functionCalled === 'getCanvasState';
}

/**
 * Test 6: Test AI error handling
 */
export async function test6_AIErrorHandling() {
  console.log('\n=== TEST 6: AI Error Handling ===');
  
  const result = await sendMessage(
    [], 
    'Create a rectangle at position -1000, -1000'
  );
  
  // AI should either:
  // 1. Return success=false (if function execution failed), OR
  // 2. Return success=true but explain the error in the message (AI caught it before executing)
  const aiCaughtError = !result.success || (result.message && result.message.includes('out of bounds'));
  
  console.log('AI error handling:', aiCaughtError ? '✅ PASS' : '❌ FAIL');
  console.log('Error message:', result.message);
  
  return aiCaughtError; // Should either fail or explain the error
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   AI SERVICE INTEGRATION TESTS      ║');
  console.log('║           PR #18                     ║');
  console.log('╚══════════════════════════════════════╝\n');
  
  const results = [];
  
  try {
    results.push({ name: 'Connection', pass: await test1_Connection() });
    results.push({ name: 'Canvas API', pass: await test2_CanvasAPI() });
    results.push({ name: 'AI Simple Command', pass: await test3_AISimpleCommand() });
    results.push({ name: 'AI Natural Language', pass: await test4_AINaturalLanguage() });
    results.push({ name: 'AI Query Command', pass: await test5_AIQueryCommand() });
    results.push({ name: 'AI Error Handling', pass: await test6_AIErrorHandling() });
  } catch (error) {
    console.error('Test execution error:', error);
  }
  
  // Summary
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║           TEST SUMMARY               ║');
  console.log('╚══════════════════════════════════════╝\n');
  
  results.forEach(({ name, pass }) => {
    console.log(`${pass ? '✅' : '❌'} ${name}`);
  });
  
  const passCount = results.filter(r => r.pass).length;
  const totalCount = results.length;
  
  console.log(`\n${passCount}/${totalCount} tests passed`);
  
  if (passCount === totalCount) {
    console.log('\n🎉 ALL TESTS PASSED! PR #18 is ready! 🚀');
  } else {
    console.log('\n⚠️ Some tests failed. Review errors above.');
  }
  
  return { passCount, totalCount, results };
}

// Export for console use
if (typeof window !== 'undefined') {
  window.aiTests = {
    test1: test1_Connection,
    test2: test2_CanvasAPI,
    test3: test3_AISimpleCommand,
    test4: test4_AINaturalLanguage,
    test5: test5_AIQueryCommand,
    test6: test6_AIErrorHandling,
    runAll: runAllTests
  };
  
  console.log('AI Tests loaded! Run tests with:');
  console.log('- window.aiTests.runAll()     (run all tests)');
  console.log('- window.aiTests.test1()      (test connection)');
  console.log('- window.aiTests.test2()      (test Canvas API)');
  console.log('- window.aiTests.test3()      (test AI command)');
}

