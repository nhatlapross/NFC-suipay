const axios = require("axios");

const BASE_URL = "http://localhost:8080";

// Test create card endpoint
async function testCreateCard() {
    try {
        console.log("🧪 Testing POST /api/card/create endpoint...\n");

        // First, we need to login as user to get token
        console.log("1. Logging in as user...");
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: "user@example.com",
            password: "user123",
        });

        const token = loginResponse.data.token;
        console.log("✅ User login successful\n");

        // Test 1: Create virtual card with default values
        console.log("2. Testing create virtual card with default values...");
        const virtualCardResponse = await axios.post(
            `${BASE_URL}/api/card/create`,
            {
                cardType: "virtual",
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Virtual card created:");
        console.log(JSON.stringify(virtualCardResponse.data, null, 2));
        console.log("\n");

        // Test 2: Create physical card with custom values
        console.log("3. Testing create physical card with custom values...");
        const physicalCardResponse = await axios.post(
            `${BASE_URL}/api/card/create`,
            {
                cardType: "physical",
                cardName: "My Premium Card",
                limits: {
                    daily: 5000000,
                    monthly: 100000000,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Physical card created:");
        console.log(JSON.stringify(physicalCardResponse.data, null, 2));
        console.log("\n");

        // Test 3: Create virtual card with custom limits
        console.log("4. Testing create virtual card with custom limits...");
        const customVirtualCardResponse = await axios.post(
            `${BASE_URL}/api/card/create`,
            {
                cardType: "virtual",
                cardName: "Business Card",
                limits: {
                    daily: 1000000,
                    monthly: 20000000,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Custom virtual card created:");
        console.log(JSON.stringify(customVirtualCardResponse.data, null, 2));
        console.log("\n");

        // Test 4: Test validation errors
        console.log("5. Testing validation errors...");
        try {
            const invalidCardResponse = await axios.post(
                `${BASE_URL}/api/card/create`,
                {
                    cardType: "invalid_type",
                    limits: {
                        daily: -1000,
                        monthly: "invalid",
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log(
                "❌ Should have failed but got:",
                invalidCardResponse.data
            );
        } catch (error) {
            console.log("✅ Validation error as expected:");
            console.log(JSON.stringify(error.response?.data, null, 2));
        }
        console.log("\n");

        // Test 5: Test missing required cardType
        console.log("6. Testing missing required cardType...");
        try {
            const missingTypeResponse = await axios.post(
                `${BASE_URL}/api/card/create`,
                {
                    cardName: "Test Card",
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log(
                "❌ Should have failed but got:",
                missingTypeResponse.data
            );
        } catch (error) {
            console.log("✅ Validation error as expected:");
            console.log(JSON.stringify(error.response?.data, null, 2));
        }
        console.log("\n");

        // Test 6: Get user cards to verify creation
        console.log("7. Testing get user cards...");
        const userCardsResponse = await axios.get(`${BASE_URL}/api/card/`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log("✅ User cards:");
        console.log(JSON.stringify(userCardsResponse.data, null, 2));
        console.log("\n");

        // Test 7: Test without authentication
        console.log("8. Testing without authentication...");
        try {
            const noAuthResponse = await axios.post(
                `${BASE_URL}/api/card/create`,
                {
                    cardType: "virtual",
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

// Test response structure
function testResponseStructure() {
    console.log("📋 Expected response structure for POST /api/card/create:");
    const expectedResponse = {
        success: true,
        message: "Card created successfully",
        data: {
            id: "64a1b2c3d4e5f6789",
            cardUuid: "550e8400-e29b-41d4-a716-446655440000",
            cardType: "standard",
            isActive: true,
            isPrimary: true,
            dailyLimit: 2000000,
            monthlyLimit: 50000000,
            dailySpent: 0,
            monthlySpent: 0,
            singleTransactionLimit: 500000,
            issueDate: "2025-01-15T10:30:00Z",
            expiryDate: "2026-01-15T10:30:00Z",
            usageCount: 0,
            lastUsed: null,
            createdAt: "2025-01-15T10:30:00Z",
            updatedAt: "2025-01-15T10:30:00Z",
        },
    };

    console.log(JSON.stringify(expectedResponse, null, 2));

    console.log("\n📝 Request body structure:");
    console.log("├── cardType: string (required, values: virtual/physical)");
    console.log("├── cardName: string (optional, max 50 characters)");
    console.log("└── limits: object (optional)");
    console.log("    ├── daily: number (optional, default: 2000000)");
    console.log("    └── monthly: number (optional, default: 50000000)");

    console.log("\n🔍 Response fields explanation:");
    console.log("├── id: MongoDB ObjectId");
    console.log("├── cardUuid: Unique UUID for the card");
    console.log("├── cardType: Type of card (standard by default)");
    console.log("├── isActive: Card status (true by default)");
    console.log(
        "├── isPrimary: Whether this is user's primary card (true if first card)"
    );
    console.log("├── dailyLimit: Daily spending limit in VND");
    console.log("├── monthlyLimit: Monthly spending limit in VND");
    console.log("├── dailySpent: Current daily spending (0 by default)");
    console.log("├── monthlySpent: Current monthly spending (0 by default)");
    console.log("├── singleTransactionLimit: Max amount per transaction");
    console.log("├── issueDate: Card issue date");
    console.log("├── expiryDate: Card expiry date (1 year from issue)");
    console.log("├── usageCount: Number of times card was used");
    console.log("├── lastUsed: Last usage timestamp");
    console.log("├── createdAt: Card creation timestamp");
    console.log("└── updatedAt: Last update timestamp");
}

// Run tests
console.log("🚀 Starting Create Card Tests...\n");
testResponseStructure();
console.log("\n" + "=".repeat(50) + "\n");
testCreateCard();
