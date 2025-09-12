// Test response structure for GET /api/admin/users
const expectedResponse = {
    success: true,
    data: {
        users: [
            {
                id: "68bf13c1746dd185de2ee844",
                email: "user@example.com",
                fullName: "Test User",
                phoneNumber: "0123456789",
                status: "active",
                kycStatus: "verified",
                role: "user",
                dailyLimit: 5000000,
                monthlyLimit: 100000000,
                lastLogin: "2025-01-15T10:30:00Z",
                createdAt: "2025-01-01T00:00:00Z",
                transactionCount: 15,
                totalVolume: 750000,
            },
        ],
        pagination: {
            total: 12,
            pages: 1,
            currentPage: 1,
            limit: 20,
        },
    },
};

console.log("✅ Expected response structure for GET /api/admin/users:");
console.log(JSON.stringify(expectedResponse, null, 2));

console.log("\n📋 Response Structure Analysis:");
console.log("├── success: boolean (true/false)");
console.log("└── data: object");
console.log("    ├── users: array of user objects");
console.log("    │   ├── id: string (MongoDB ObjectId)");
console.log("    │   ├── email: string");
console.log("    │   ├── fullName: string");
console.log("    │   ├── phoneNumber: string");
console.log("    │   ├── status: string (active/blocked/suspended)");
console.log("    │   ├── kycStatus: string (pending/verified/rejected)");
console.log("    │   ├── role: string (user/merchant/admin)");
console.log("    │   ├── dailyLimit: number");
console.log("    │   ├── monthlyLimit: number");
console.log("    │   ├── lastLogin: string (ISO date)");
console.log("    │   ├── createdAt: string (ISO date)");
console.log("    │   ├── transactionCount: number");
console.log("    │   └── totalVolume: number");
console.log("    └── pagination: object");
console.log("        ├── total: number (total count)");
console.log("        ├── pages: number (total pages)");
console.log("        ├── currentPage: number");
console.log("        └── limit: number");

console.log("\n🔍 Query Parameters Supported:");
console.log("├── page: number (optional, default: 1)");
console.log("├── limit: number (optional, default: 20, max: 100)");
console.log("├── status: string (optional, values: active/blocked/suspended)");
console.log("├── role: string (optional, values: user/merchant/admin)");
console.log(
    "└── kycStatus: string (optional, values: pending/verified/rejected)"
);

console.log("\n📝 Example API Calls:");
console.log("GET /api/admin/users");
console.log("GET /api/admin/users?page=1&limit=20");
console.log("GET /api/admin/users?status=active&role=user");
console.log(
    "GET /api/admin/users?page=1&limit=10&status=active&role=user&kycStatus=verified"
);
