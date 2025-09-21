# QR Payment Test Page

Trang test quy trình thanh toán QR code với luồng Merchant → User.

## Truy cập

```
http://localhost:3000/test-qr-payment
```

## Quy trình test

### 1. Merchant tạo QR Payment Request
- Chuyển sang tab "Merchant (Tạo QR)"
- Nhập số tiền cần thanh toán (VD: 0.05 SUI)
- Nhập mô tả giao dịch (VD: "Test QR Payment")
- Click "Tạo QR Thanh Toán"
- Hệ thống sẽ:
  - Tự động đăng nhập merchant với credentials từ TEST_DATA
  - Gọi API `POST /api/payment/merchant/create-request`
  - Hiển thị QR code với payment request data

### 2. User quét QR và thanh toán
- Chuyển sang tab "User (Quét QR & Thanh toán)"
- Hệ thống hiển thị thông tin QR đã được "quét":
  - Amount: số tiền từ merchant request
  - Merchant ID: từ merchant request
  - Request ID: từ merchant request
- Nhập thông tin user:
  - Card UUID (mặc định: `0ee8b0b0-ba0a-420f-bb45-947822ce14b3`)
  - PIN (mặc định: `1234`)
- Click "Xác nhận thanh toán"
- Hệ thống sẽ:
  - Gọi API `POST /api/payment/process-direct`
  - Hiển thị kết quả thanh toán với transaction details

## Test Cases có sẵn

### Valid Payment
- Amount: 0.05 SUI
- PIN: 1234
- Card UUID: Test card UUID

### Invalid PIN
- Amount: 0.05 SUI
- PIN: 0000 (sai PIN)
- Card UUID: Test card UUID

### High Amount
- Amount: 1.0 SUI
- PIN: 1234
- Card UUID: Test card UUID

## API Endpoints được test

1. **Merchant Login**: `POST /api/auth/login`
2. **Tạo Payment Request**: `POST /api/payment/merchant/create-request`
3. **Kiểm tra Request Status**: `GET /api/payment/merchant/request/:id`
4. **Xử lý thanh toán**: `POST /api/payment/process-direct`

## Dữ liệu test

```javascript
const TEST_DATA = {
  merchant: {
    email: "merchant@test.com",
    password: "password123",
    merchantId: "mch_593200537dff4e71"
  },
  user: {
    cardUuid: "0ee8b0b0-ba0a-420f-bb45-947822ce14b3",
    pin: "1234",
    email: "customer@test.com"
  }
};
```

## Features

### Visual Flow Indicator
- Process flow với 5 bước được hiển thị rõ ràng
- Icons thay đổi màu sắc theo tiến độ

### Real-time Status Updates
- Merchant request status được cập nhật theo thời gian thực
- Backend connectivity status indicator

### QR Code Generation
- QR code được generate từ Google Charts API
- Chứa JSON data với requestId, amount, merchantId

### Error Handling
- Hiển thị lỗi chi tiết khi API calls thất bại
- Validation input fields
- Server health check

### Responsive Design
- Mobile-friendly layout
- Tab interface dễ sử dụng
- Card-based UI components

## Backend Requirements

Backend cần có các endpoints sau để test page hoạt động:

1. `GET /health` - Health check
2. `POST /api/auth/login` - Merchant authentication
3. `POST /api/payment/merchant/create-request` - Tạo payment request
4. `GET /api/payment/merchant/request/:id` - Get request status
5. `POST /api/payment/process-direct` - Process payment

## Troubleshooting

### Backend Offline
- Kiểm tra backend server đang chạy trên port 8080
- Click "Refresh" để kiểm tra lại connection

### Authentication Error
- Đảm bảo merchant test account tồn tại trong database
- Check merchant credentials trong TEST_DATA

### Payment Failure
- Kiểm tra user card UUID có tồn tại trong database
- Verify PIN matches với card data
- Check wallet balance đủ để thực hiện giao dịch