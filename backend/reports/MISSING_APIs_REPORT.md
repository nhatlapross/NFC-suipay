# MISSING APIs REPORT - NFC PAYMENT SYSTEM
## Báo cáo các API chưa được implement trong hệ thống

---

## ⚠️ TỔNG QUAN
Sau khi so sánh các báo cáo API với code thực tế, đây là danh sách các API endpoints chưa được implement hoặc cần được thêm vào hệ thống.

---

## 👤 USER ROLE - APIs Chưa Implement

### 🔐 Authentication APIs
✅ **Đã có:** register, login, verify-email, forgot-password, reset-password  
❌ **Chưa có:**
```http
# Resend verification email
POST /api/auth/resend-verification
Content-Type: application/json
{
  "email": "user@example.com"
}

# Verify phone number
POST /api/auth/verify-phone
Content-Type: application/json
{
  "phoneNumber": "0123456789",
  "code": "123456"
}
```

### 💳 Card Management APIs  
✅ **Đã có:** Hầu hết card operations  
❌ **Chưa có:**
```http
# Toggle card status (một endpoint thống nhất)
POST /api/cards/:cardId/toggle-status
Authorization: Bearer {token}
Content-Type: application/json
{
  "reason": "User request"
}

# Card replacement
POST /api/cards/:cardId/replace
Authorization: Bearer {token}
Content-Type: application/json
{
  "reason": "lost_stolen",
  "urgency": "high"
}
```

### 💰 Payment APIs
✅ **Đã có:** Basic payment processing  
❌ **Chưa có:**
```http
# Create payment intent (for QR payments)
POST /api/payment/create
Authorization: Bearer {token}
Content-Type: application/json
{
  "cardUuid": "550e8400-e29b-41d4-a716-446655440000",
  "merchantId": "mch_1234567890abcdef",
  "amount": 50000,
  "currency": "SUI"
}

# Confirm payment (separate from create)
POST /api/payment/:transactionId/confirm
Authorization: Bearer {token}
Content-Type: application/json
{
  "pin": "1234",
  "biometricData": "optional_hash"
}

# Check payment status
GET /api/payment/:transactionId/status
Authorization: Bearer {token}

# Cancel pending payment
POST /api/payment/:transactionId/cancel
Authorization: Bearer {token}
```

### 📊 Transaction APIs
⚠️ **Cần cải thiện:** Transaction filtering  
❌ **Chưa có:**
```http
# Advanced transaction filtering
GET /api/transactions?type=payment&status=completed&merchant=coffee&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer {token}

# Transaction receipt
GET /api/transactions/:id/receipt
Authorization: Bearer {token}

# Export transactions
GET /api/transactions/export?format=csv&period=month
Authorization: Bearer {token}
```

---

## 🏪 MERCHANT ROLE - APIs Chưa Implement

### 💰 Payment Request APIs
❌ **Hoàn toàn chưa có:**
```http
# Create payment request (for QR generation)
POST /api/payment/merchant/create-request
Authorization: X-API-Key: pk_test_xxx
X-API-Secret: sk_test_xxx
Content-Type: application/json
{
  "amount": 50000,
  "currency": "SUI",
  "description": "Coffee + Cake",
  "orderId": "ORDER_123456",
  "expiresIn": 300
}

# Check payment request status  
GET /api/payment/merchant/request/:requestId
Authorization: X-API-Key: pk_test_xxx
X-API-Secret: sk_test_xxx

# Cancel payment request
POST /api/payment/merchant/request/:requestId/cancel
Authorization: X-API-Key: pk_test_xxx
X-API-Secret: sk_test_xxx
```

### 📊 Analytics & Reporting
❌ **Hoàn toàn chưa có:**
```http
# Payment statistics
GET /api/merchants/payments/stats?period=week
Authorization: X-API-Key: pk_test_xxx
X-API-Secret: sk_test_xxx

# Top products/orders analysis
GET /api/merchants/analytics/top-orders?period=month&limit=10
Authorization: X-API-Key: pk_test_xxx
X-API-Secret: sk_test_xxx

# Customer insights
GET /api/merchants/analytics/customers?period=month
Authorization: X-API-Key: pk_test_xxx
X-API-Secret: sk_test_xxx

# Revenue reports
GET /api/merchants/reports/revenue?startDate=2025-01-01&endDate=2025-01-31&format=pdf
Authorization: X-API-Key: pk_test_xxx
X-API-Secret: sk_test_xxx
```

### 🔔 Webhook Testing
❌ **Chưa có:**
```http
# Test webhook
POST /api/merchants/webhooks/:webhookId/test
Authorization: X-API-Key: pk_test_xxx
X-API-Secret: sk_test_xxx

# Webhook logs
GET /api/merchants/webhooks/:webhookId/logs
Authorization: X-API-Key: pk_test_xxx
X-API-Secret: sk_test_xxx
```

---

## 👨‍💼 ADMIN ROLE - APIs Chưa Implement hoặc Chỉ có Stub

### 📊 Advanced Analytics  
⚠️ **Có endpoint nhưng chỉ trả về "not implemented":**
```http
# Analytics with filters
GET /api/admin/analytics?period=week&metrics=revenue,transactions,users
Authorization: Bearer {adminToken}

# Revenue analytics  
GET /api/admin/analytics/revenue?period=month&groupBy=day
Authorization: Bearer {adminToken}

# User behavior analytics
GET /api/admin/analytics/users?metrics=growth,retention,activity&period=quarter
Authorization: Bearer {adminToken}
```

### ⚙️ System Settings
⚠️ **Có endpoint nhưng chỉ trả về "not implemented":**
```http
# Get system settings (có route nhưng chưa implement)
GET /api/admin/settings
Authorization: Bearer {adminToken}

# Update system settings (có route nhưng chưa implement)  
PUT /api/admin/settings
Authorization: Bearer {adminToken}
```

### 🛠️ Cache Management
⚠️ **Có endpoint nhưng chỉ trả về "not implemented":**
```http
# Clear cache (có route nhưng chưa implement)
POST /api/admin/cache/clear
Authorization: Bearer {adminToken}
Content-Type: application/json
{
  "cacheType": "all"
}
```

### 📋 Advanced Reporting
❌ **Chưa có:**
```http
# System performance reports
GET /api/admin/reports/performance?startDate=2025-01-01&endDate=2025-01-31&format=pdf
Authorization: Bearer {adminToken}

# Compliance reports
GET /api/admin/reports/compliance?type=kyc,transaction&month=2025-01
Authorization: Bearer {adminToken}

# Fraud detection reports
GET /api/admin/reports/fraud?period=week&severity=high
Authorization: Bearer {adminToken}
```

---

## 🔧 SYSTEM-WIDE APIs Chưa Có

### 🔄 WebSocket/Real-time APIs
❌ **Chưa có WebSocket implementation:**
```javascript
// WebSocket connections cho real-time updates
ws://localhost:8080/user/{userId}      // User notifications
ws://localhost:8080/merchant/{merchantId}  // Merchant payments  
ws://localhost:8080/admin              // Admin system alerts
```

### 📤 Notification APIs
❌ **Chưa có hệ thống notification:**
```http
# Send notification
POST /api/notifications/send
Authorization: Bearer {token}
Content-Type: application/json
{
  "type": "payment_completed",
  "recipients": ["user_id_1", "user_id_2"],
  "message": "Payment completed successfully"
}

# Notification templates
GET /api/notifications/templates
Authorization: Bearer {adminToken}
```

### 🔍 Search & Filtering APIs
❌ **Chưa có global search:**
```http
# Global search
GET /api/search?q=coffee&type=merchant,transaction&limit=20
Authorization: Bearer {token}

# Advanced filters for all entities
GET /api/admin/search/transactions?q=failed&merchant=coffee&amount_min=10000
Authorization: Bearer {adminToken}
```

### 📊 Reporting & Export APIs
❌ **Chưa có export functionality:**
```http
# Export data
POST /api/export/transactions
Authorization: Bearer {token}
Content-Type: application/json
{
  "format": "csv",
  "filters": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "status": "completed"
  }
}

# Download export
GET /api/export/:exportId/download
Authorization: Bearer {token}
```

---

## 🔐 Security & Compliance APIs

### 🛡️ Advanced Security
❌ **Chưa có:**
```http
# Security audit logs
GET /api/admin/security/audit?action=login_attempt&status=failed&limit=100
Authorization: Bearer {adminToken}

# IP whitelist management  
GET /api/admin/security/whitelist
POST /api/admin/security/whitelist
DELETE /api/admin/security/whitelist/:ip
Authorization: Bearer {adminToken}

# Rate limit configuration
GET /api/admin/security/rate-limits
PUT /api/admin/security/rate-limits
Authorization: Bearer {adminToken}
```

### 📋 Compliance
❌ **Chưa có:**
```http
# AML (Anti-Money Laundering) reports
GET /api/admin/compliance/aml?period=month&threshold=1000000
Authorization: Bearer {adminToken}

# Suspicious activity reports
GET /api/admin/compliance/suspicious?period=week
POST /api/admin/compliance/suspicious/:userId/flag
Authorization: Bearer {adminToken}
```

---

## 🚨 PRIORITY IMPLEMENTATION LIST

### 🔥 **Cao (Cần để app hoạt động cơ bản):**
1. **Payment Create/Confirm flow** - Để user có thể thanh toán  
2. **Merchant Payment Request** - Để merchant tạo QR code
3. **Transaction filtering** - Để xem lịch sử chi tiết
4. **Basic notification system** - Để thông báo trạng thái thanh toán

### ⚡ **Trung bình (Cần cho production):**  
1. **WebSocket real-time updates** - Để UX tốt hơn
2. **Admin settings implementation** - Để quản trị hệ thống
3. **Merchant analytics** - Để merchant theo dõi doanh thu
4. **Export functionality** - Để xuất báo cáo

### 💡 **Thấp (Enhancement features):**
1. **Advanced analytics** - Để insights sâu hơn  
2. **Compliance reports** - Để tuân thủ quy định
3. **Security audit** - Để bảo mật nâng cao
4. **Global search** - Để tìm kiếm dễ dàng

---

## 📝 NOTES CHO DEVELOPMENT

### ⚠️ **Các Controller cần implement:**
- `paymentController.createPayment()` - Tạo payment intent
- `paymentController.confirmPayment()` - Xác nhận thanh toán  
- `merchantController.createPaymentRequest()` - Tạo QR payment
- `merchantController.getPaymentStats()` - Thống kê merchant
- `adminController.getAnalytics()` - Analytics (đã có route, chưa implement)
- `adminController.getSystemSettings()` - Settings (đã có route, chưa implement)

### ⚠️ **Các Service cần tạo:**
- `NotificationService` - Quản lý thông báo
- `ReportingService` - Xuất báo cáo  
- `AnalyticsService` - Phân tích dữ liệu
- `WebSocketService` - Real-time updates

### ⚠️ **Database Schema cần thêm:**
- `Notifications` table
- `PaymentRequests` table  
- `ExportJobs` table
- `AuditLogs` table

---

**Tổng kết:** Hệ thống hiện tại đã có khoảng **60-70%** APIs cần thiết. Các APIs còn thiếu chủ yếu là analytics, reporting, real-time features và một số payment flow APIs quan trọng.