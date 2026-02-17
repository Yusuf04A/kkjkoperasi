#!/usr/bin/env node

/**
 * API Testing Script
 * File: LARAVEL_SETUP/test-api.js
 * 
 * Usage: node test-api.js
 * 
 * Script ini untuk testing semua endpoint Laravel API
 * Pastikan Laravel server sudah running di http://127.0.0.1:8000
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';
let authToken = '';
let currentUser = null;

/**
 * Utility function untuk API request
 */
async function apiRequest(method, endpoint, data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            console.error(`❌ Error: ${result.message}`);
            if (result.errors) {
                console.error('Errors:', result.errors);
            }
            return null;
        }

        return result;
    } catch (error) {
        console.error('❌ Request failed:', error.message);
        return null;
    }
}

/**
 * Helper function untuk print hasil
 */
function printResult(title, data, success = true) {
    console.log(`\n${success ? '✅' : '❌'} ${title}`);
    console.log(JSON.stringify(data, null, 2));
}

/**
 * TEST 1: Register User
 */
async function testRegister() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 1: Register User');
    console.log('════════════════════════════════════════');

    const registerData = {
        name: 'Test User',
        email: `testuser${Date.now()}@example.com`,
        phone: '081234567890',
        password: 'password123',
        password_confirmation: 'password123',
    };

    const result = await apiRequest('POST', '/register', registerData);
    if (result && result.token) {
        authToken = result.token;
        currentUser = result.user;
        printResult('Register berhasil', result);
    }
}

/**
 * TEST 2: Login
 */
async function testLogin() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 2: Login');
    console.log('════════════════════════════════════════');

    const loginData = {
        email: 'budi@example.com',
        password: 'password123',
    };

    const result = await apiRequest('POST', '/login', loginData);
    if (result && result.token) {
        authToken = result.token;
        currentUser = result.user;
        printResult('Login berhasil', result);
    }
}

/**
 * TEST 3: Get User Profile
 */
async function testGetProfile() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 3: Get User Profile');
    console.log('════════════════════════════════════════');

    const result = await apiRequest('GET', '/user-profile');
    if (result) {
        printResult('Get profile berhasil', result);
    }
}

/**
 * TEST 4: Update User Profile
 */
async function testUpdateProfile() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 4: Update User Profile');
    console.log('════════════════════════════════════════');

    const updateData = {
        name: 'Budi Santoso Updated',
        phone: '089876543210',
    };

    const result = await apiRequest('PUT', '/user-profile', updateData);
    if (result) {
        printResult('Update profile berhasil', result);
    }
}

/**
 * TEST 5: Create Pawn Transaction
 */
async function testCreatePawn() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 5: Create Pawn Transaction');
    console.log('════════════════════════════════════════');

    const pawnData = {
        item_name: 'Emas perhiasan 10 gram',
        loan_amount: 750000,
        description: 'Gadai untuk kebutuhan mendadak',
    };

    const result = await apiRequest('POST', '/pawn', pawnData);
    if (result) {
        printResult('Create pawn berhasil', result);
        return result.data?.id;
    }
    return null;
}

/**
 * TEST 6: Get Pawn Transactions
 */
async function testGetPawns() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 6: Get Pawn Transactions');
    console.log('════════════════════════════════════════');

    const result = await apiRequest('GET', '/pawn');
    if (result) {
        printResult('Get pawns berhasil', result);
    }
}

/**
 * TEST 7: Get Pawn Detail
 */
async function testGetPawnDetail(pawnId) {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 7: Get Pawn Detail');
    console.log('════════════════════════════════════════');

    const result = await apiRequest('GET', `/pawn/${pawnId}`);
    if (result) {
        printResult('Get pawn detail berhasil', result);
    }
}

/**
 * TEST 8: Create Balance Transaction (Top Up)
 */
async function testCreateBalance() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 8: Create Balance Transaction (Top Up)');
    console.log('════════════════════════════════════════');

    const balanceData = {
        type: 'topup',
        amount: 500000,
        payment_method: 'Bank Transfer',
        notes: 'Top up saldo via testing',
    };

    const result = await apiRequest('POST', '/balance', balanceData);
    if (result) {
        printResult('Create balance transaction berhasil', result);
    }
}

/**
 * TEST 9: Get Balance Transactions
 */
async function testGetBalances() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 9: Get Balance Transactions');
    console.log('════════════════════════════════════════');

    const result = await apiRequest('GET', '/balance');
    if (result) {
        printResult('Get balance transactions berhasil', result);
    }
}

/**
 * TEST 10: Get Balance Summary
 */
async function testGetBalanceSummary() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 10: Get Balance Summary');
    console.log('════════════════════════════════════════');

    const result = await apiRequest('GET', '/balance-summary');
    if (result) {
        printResult('Get balance summary berhasil', result);
    }
}

/**
 * TEST 11: Get Notifications
 */
async function testGetNotifications() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 11: Get Notifications');
    console.log('════════════════════════════════════════');

    const result = await apiRequest('GET', '/notifications');
    if (result) {
        printResult('Get notifications berhasil', result);
    }
}

/**
 * TEST 12: Get Unread Count
 */
async function testGetUnreadCount() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 12: Get Unread Count');
    console.log('════════════════════════════════════════');

    const result = await apiRequest('GET', '/notifications/unread-count');
    if (result) {
        printResult('Get unread count berhasil', result);
    }
}

/**
 * TEST 13: Change Password
 */
async function testChangePassword() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 13: Change Password');
    console.log('════════════════════════════════════════');

    const changeData = {
        old_password: 'password123',
        new_password: 'newpassword123',
        new_password_confirmation: 'newpassword123',
    };

    const result = await apiRequest('POST', '/change-password', changeData);
    if (result) {
        printResult('Change password berhasil', result);
    }
}

/**
 * TEST 14: Logout
 */
async function testLogout() {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 14: Logout');
    console.log('════════════════════════════════════════');

    const result = await apiRequest('POST', '/logout');
    if (result) {
        printResult('Logout berhasil', result);
        authToken = '';
    }
}

/**
 * MAIN FUNCTION
 */
async function runAllTests() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   LARAVEL API TESTING SCRIPT            ║');
    console.log('║   Testing all endpoints                 ║');
    console.log('╚════════════════════════════════════════╝');

    // Test login terlebih dahulu
    await testLogin();

    // Test protected routes
    await testGetProfile();
    await testUpdateProfile();

    // Test pawn transactions
    const pawnId = await testCreatePawn();
    await testGetPawns();
    if (pawnId) {
        await testGetPawnDetail(pawnId);
    }

    // Test balance transactions
    await testCreateBalance();
    await testGetBalances();
    await testGetBalanceSummary();

    // Test notifications
    await testGetNotifications();
    await testGetUnreadCount();

    // Test change password
    // await testChangePassword();

    // Test logout
    await testLogout();

    console.log('\n════════════════════════════════════════');
    console.log('✅ Testing selesai!');
    console.log('════════════════════════════════════════\n');
}

// Run tests
runAllTests().catch(console.error);
