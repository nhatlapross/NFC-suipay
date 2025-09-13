const axios = require("axios");

const BASE_URL = "http://localhost:8080";

// Test admin users endpoint
async function testAdminUsers() {
    try {
        console.log("🧪 Testing GET /api/admin/users endpoint...\n");

        // First, we need to login as admin to get token
        console.log("1. Logging in as admin...");
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: "admin@example.com",
            password: "admin123",
        });

        const token = loginResponse.data.token;
        console.log("✅ Admin login successful\n");

        // Test basic users endpoint
        console.log("2. Testing basic users endpoint...");
        const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log("✅ Users endpoint response:");
        console.log(JSON.stringify(usersResponse.data, null, 2));
        console.log("\n");

        // Test with filters
        console.log(
            "3. Testing with filters (page=1&limit=5&status=active&role=user)..."
        );
        const filteredResponse = await axios.get(
            `${BASE_URL}/api/admin/users?page=1&limit=5&status=active&role=user`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Filtered users response:");
        console.log(JSON.stringify(filteredResponse.data, null, 2));
        console.log("\n");

        // Test with KYC status filter
        console.log("4. Testing with KYC status filter...");
        const kycResponse = await axios.get(
            `${BASE_URL}/api/admin/users?kycStatus=verified`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ KYC filtered users response:");
        console.log(JSON.stringify(kycResponse.data, null, 2));
        console.log("\n");

        // Test with multiple filters
        console.log(
            "5. Testing with multiple filters (page=1&limit=10&status=active&role=user&kycStatus=verified)..."
        );
        const multiFilterResponse = await axios.get(
            `${BASE_URL}/api/admin/users?page=1&limit=10&status=active&role=user&kycStatus=verified`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Multi-filtered users response:");
        console.log(JSON.stringify(multiFilterResponse.data, null, 2));
        console.log("\n");

        // Test pagination
        console.log("6. Testing pagination (page=2&limit=3)...");
        const paginationResponse = await axios.get(
            `${BASE_URL}/api/admin/users?page=2&limit=3`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("✅ Pagination response:");
        console.log(JSON.stringify(paginationResponse.data, null, 2));
        console.log("\n");

        // Test invalid filters
        console.log(
            "7. Testing invalid filters (should return validation error)..."
        );
        try {
            const invalidResponse = await axios.get(
                `${BASE_URL}/api/admin/users?status=invalid&role=invalid`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("❌ Should have failed but got:", invalidResponse.data);
        } catch (error) {
            console.log("✅ Validation error as expected:");
            console.log(JSON.stringify(error.response?.data, null, 2));
        }
    } catch (error) {
        console.error("❌ Test failed:", error.response?.data || error.message);
    }
}

// Run the test
testAdminUsers();
