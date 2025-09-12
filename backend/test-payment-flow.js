const axios = require("axios");

const BASE_URL = "http://localhost:8080";

// Test payment flow endpoints
async function testPaymentFlow() {
    try {
        console.log("🧪 Testing Payment Flow endpoints...\n");

        // First, we need to login as user to get token
        console.log("1. Logging in as user...");
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: "user@example.com",
            password: "user123",
        });

        const token = loginResponse.data.token;
        console.log("✅ User login successful\n");

        // Test 1: Create a card first (required for payment)
        console.log("2. Creating a card for payment testing...");
        const cardResponse = await axios.post(
            `${BASE_URL}/api/card/create`,
            {
                cardType: "virtual",
                cardName: "Payment Test Card",
                limits: {
                    daily: 10000000, // 10M VND
                    monthly: 100000000, // 100M VND
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const cardUuid = cardResponse.data.data.cardUuid;
        console.log("✅ Card created:", cardUuid);
        console.log("\n");

        // Test 2: Validate payment (public endpoint)
        console.log("3. Testing payment validation...");
        const validateResponse = await axios.post(
            `${BASE_URL}/api/payment/validate`,
            {
                cardUuid: cardUuid,
                amount: 100000, // 100K VND
                merchantId: "merchant123",
            }
        );

        console.log("✅ Payment validation response:");
        console.log(JSON.stringify(validateResponse.data, null, 2));
        console.log("\n");

        // Test 3: Create payment intent
        console.log("4. Testing create payment intent...");
        const intentResponse = await axios.post(
            `${BASE_URL}/api/payment/create`,
            {
                cardUuid: cardUuid,
                amount: 100000, // 100K VND
                merchantId: "merchant123",
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const paymentId = intentResponse.data.data.id;
        console.log("✅ Payment intent created:", paymentId);
        console.log(JSON.stringify(intentResponse.data, null, 2));
        console.log("\n");

        // Test 4: Get payment status
        console.log("5. Testing get payment status...");
        const statusResponse = await axios.get(
            `${BASE_URL}/api/payment/${paymentId}/status`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Payment status:");
        console.log(JSON.stringify(statusResponse.data, null, 2));
        console.log("\n");

        // Test 5: Confirm payment
        console.log("6. Testing confirm payment...");
        const confirmResponse = await axios.post(
            `${BASE_URL}/api/payment/${paymentId}/confirm`,
            {
                pin: "1234", // Default PIN for testing
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Payment confirmed:");
        console.log(JSON.stringify(confirmResponse.data, null, 2));
        console.log("\n");

        // Test 6: Get final payment status
        console.log("7. Testing final payment status...");
        const finalStatusResponse = await axios.get(
            `${BASE_URL}/api/payment/${paymentId}/status`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Final payment status:");
        console.log(JSON.stringify(finalStatusResponse.data, null, 2));
        console.log("\n");

        // Test 7: Get transaction history
        console.log("8. Testing get transaction history...");
        const historyResponse = await axios.get(
            `${BASE_URL}/api/payment/transactions`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Transaction history:");
        console.log(JSON.stringify(historyResponse.data, null, 2));
        console.log("\n");

        // Test 8: Get payment stats
        console.log("9. Testing get payment stats...");
        const statsResponse = await axios.get(`${BASE_URL}/api/payment/stats`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log("✅ Payment stats:");
        console.log(JSON.stringify(statsResponse.data, null, 2));
        console.log("\n");

        // Test 9: Test direct payment processing
        console.log("10. Testing direct payment processing...");
        const directResponse = await axios.post(
            `${BASE_URL}/api/payment/process-direct`,
            {
                cardUuid: cardUuid,
                amount: 50000, // 50K VND
                merchantId: "merchant456",
                pin: "1234",
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Direct payment processed:");
        console.log(JSON.stringify(directResponse.data, null, 2));
        console.log("\n");

        // Test 10: Test merchant payment request
        console.log("11. Testing merchant payment request...");
        const merchantRequestResponse = await axios.post(
            `${BASE_URL}/api/payment/merchant/create-request`,
            {
                amount: 75000, // 75K VND
                description: "Test merchant payment request",
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const requestId = merchantRequestResponse.data.data.id;
        console.log("✅ Merchant payment request created:", requestId);
        console.log(JSON.stringify(merchantRequestResponse.data, null, 2));
        console.log("\n");

        // Test 11: Get merchant payment request
        console.log("12. Testing get merchant payment request...");
        const getRequestResponse = await axios.get(
            `${BASE_URL}/api/payment/merchant/request/${requestId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Merchant payment request details:");
        console.log(JSON.stringify(getRequestResponse.data, null, 2));
        console.log("\n");

        // Test 12: Test validation errors
        console.log("13. Testing validation errors...");
        try {
            const invalidResponse = await axios.post(
                `${BASE_URL}/api/payment/validate`,
                {
                    cardUuid: "invalid-uuid",
                    amount: -100,
                    merchantId: "",
                }
            );
            console.log("❌ Should have failed but got:", invalidResponse.data);
        } catch (error) {
            console.log("✅ Validation error as expected:");
            console.log(JSON.stringify(error.response?.data, null, 2));
        }
        console.log("\n");

        // Test 13: Test payment cancellation
        console.log("14. Testing payment cancellation...");
        // First create a new payment intent
        const cancelIntentResponse = await axios.post(
            `${BASE_URL}/api/payment/create`,
            {
                cardUuid: cardUuid,
                amount: 25000, // 25K VND
                merchantId: "merchant789",
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const cancelPaymentId = cancelIntentResponse.data.data.id;
        console.log(
            "Created payment intent for cancellation:",
            cancelPaymentId
        );

        // Now cancel it
        const cancelResponse = await axios.post(
            `${BASE_URL}/api/payment/${cancelPaymentId}/cancel`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Payment cancelled:");
        console.log(JSON.stringify(cancelResponse.data, null, 2));
        console.log("\n");

        // Test 14: Test without authentication
        console.log("15. Testing without authentication...");
        try {
            const noAuthResponse = await axios.post(
                `${BASE_URL}/api/payment/process`,
                {
                    cardUuid: cardUuid,
                    amount: 100000,
                    merchantId: "merchant123",
                }
            );
            console.log("❌ Should have failed but got:", noAuthResponse.data);
        } catch (error) {
            console.log("✅ Authentication error as expected:");
            console.log(JSON.stringify(error.response?.data, null, 2));
        }
    } catch (error) {
        console.error("❌ Test failed:", error.response?.data || error.message);
    }
}

// Test response structures
function testResponseStructures() {
    console.log("📋 Payment Flow Response Structures:\n");

    console.log("1. Payment Validation Response:");
    const validateResponse = {
        success: true,
        data: {
            isValid: true,
            cardInfo: {
                cardUuid: "550e8400-e29b-41d4-a716-446655440000",
                cardType: "virtual",
                isActive: true,
                dailyLimit: 10000000,
                monthlyLimit: 100000000,
                dailySpent: 0,
                monthlySpent: 0,
            },
            merchantInfo: {
                merchantId: "merchant123",
                merchantName: "Test Merchant",
                isActive: true,
            },
            amount: 100000,
            currency: "VND",
            estimatedFees: 1000,
        },
    };
    console.log(JSON.stringify(validateResponse, null, 2));
    console.log("\n");

    console.log("2. Payment Intent Response:");
    const intentResponse = {
        success: true,
        message: "Payment intent created successfully",
        data: {
            id: "64a1b2c3d4e5f6789",
            cardUuid: "550e8400-e29b-41d4-a716-446655440000",
            amount: 100000,
            currency: "VND",
            merchantId: "merchant123",
            status: "pending",
            expiresAt: "2025-01-15T11:00:00Z",
            createdAt: "2025-01-15T10:30:00Z",
        },
    };
    console.log(JSON.stringify(intentResponse, null, 2));
    console.log("\n");

    console.log("3. Payment Status Response:");
    const statusResponse = {
        success: true,
        data: {
            id: "64a1b2c3d4e5f6789",
            status: "completed",
            amount: 100000,
            currency: "VND",
            merchantId: "merchant123",
            transactionHash: "0x1234567890abcdef...",
            completedAt: "2025-01-15T10:35:00Z",
        },
    };
    console.log(JSON.stringify(statusResponse, null, 2));
    console.log("\n");

    console.log("4. Transaction History Response:");
    const historyResponse = {
        success: true,
        data: {
            transactions: [
                {
                    id: "64a1b2c3d4e5f6789",
                    cardUuid: "550e8400-e29b-41d4-a716-446655440000",
                    amount: 100000,
                    currency: "VND",
                    status: "completed",
                    merchantId: "merchant123",
                    createdAt: "2025-01-15T10:30:00Z",
                    completedAt: "2025-01-15T10:35:00Z",
                },
            ],
            pagination: {
                total: 1,
                pages: 1,
                currentPage: 1,
                limit: 20,
            },
        },
    };
    console.log(JSON.stringify(historyResponse, null, 2));
    console.log("\n");

    console.log("5. Payment Stats Response:");
    const statsResponse = {
        success: true,
        data: {
            totalTransactions: 5,
            totalVolume: 500000,
            successRate: 100,
            todayTransactions: 2,
            todayVolume: 150000,
            monthlyTransactions: 5,
            monthlyVolume: 500000,
        },
    };
    console.log(JSON.stringify(statsResponse, null, 2));
    console.log("\n");

    console.log("6. Merchant Payment Request Response:");
    const merchantRequestResponse = {
        success: true,
        message: "Merchant payment request created successfully",
        data: {
            id: "req_64a1b2c3d4e5f6789",
            amount: 75000,
            currency: "VND",
            description: "Test merchant payment request",
            qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
            expiresAt: "2025-01-15T11:00:00Z",
            createdAt: "2025-01-15T10:30:00Z",
        },
    };
    console.log(JSON.stringify(merchantRequestResponse, null, 2));
    console.log("\n");

    console.log("📝 Payment Flow Endpoints:");
    console.log("├── POST /api/payment/validate (public)");
    console.log("├── POST /api/payment/nfc-validate (public)");
    console.log("├── POST /api/payment/process (authenticated)");
    console.log("├── POST /api/payment/create (authenticated)");
    console.log("├── POST /api/payment/:id/confirm (authenticated)");
    console.log("├── GET  /api/payment/:id/status (authenticated)");
    console.log("├── POST /api/payment/:id/cancel (authenticated)");
    console.log("├── POST /api/payment/process-async (authenticated)");
    console.log("├── POST /api/payment/process-direct (authenticated)");
    console.log("├── POST /api/payment/sign (authenticated)");
    console.log("├── POST /api/payment/complete (authenticated)");
    console.log("├── GET  /api/payment/transactions (authenticated)");
    console.log("├── GET  /api/payment/transactions/:id (authenticated)");
    console.log(
        "├── POST /api/payment/transactions/:id/refund (admin/merchant)"
    );
    console.log("├── GET  /api/payment/stats (authenticated)");
    console.log(
        "├── POST /api/payment/merchant/create-request (authenticated)"
    );
    console.log("└── GET  /api/payment/merchant/request/:id (authenticated)");
}

// Run tests
console.log("🚀 Starting Payment Flow Tests...\n");
testResponseStructures();
console.log("\n" + "=".repeat(50) + "\n");
testPaymentFlow();
