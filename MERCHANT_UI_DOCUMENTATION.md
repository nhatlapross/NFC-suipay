# MERCHANT UI DOCUMENTATION - NFC PAYMENT SYSTEM

## Tổng quan
Giao diện merchant được thiết kế để các cửa hàng, nhà hàng và doanh nghiệp có thể dễ dàng quản lý thanh toán NFC, theo dõi doanh thu và tích hợp với hệ thống của họ.

## 1. DASHBOARD CHÍNH (Merchant Dashboard)

### Layout chính
```
┌─────────────────────────────────────────────────────────┐
│  🏪 MERCHANT DASHBOARD                    [API Keys] [Settings] │
├─────────────────────────────────────────────────────────┤
│  📊 TODAY'S STATS                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ $1,250  │ │   45    │ │  98.5%  │ │  $2.50  │        │
│  │ Revenue │ │ Orders  │ │Success  │ │Commission│        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────────────────┤
│  💳 TAP-TO-PAY TERMINAL                                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Amount: $____.00                               │    │
│  │  [TAP NFC CARD TO PAY]                          │    │
│  │  Status: Waiting for card...                    │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  📈 RECENT TRANSACTIONS                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │ #1234 | $25.00 | ✅ Success | 2 min ago        │    │
│  │ #1233 | $50.00 | ✅ Success | 5 min ago        │    │
│  │ #1232 | $15.00 | ❌ Failed  | 10 min ago       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Tính năng chính:
- **Real-time stats**: Doanh thu, số đơn hàng, tỷ lệ thành công, hoa hồng
- **NFC Terminal**: Giao diện tap-to-pay trực tiếp
- **Recent Transactions**: Danh sách giao dịch gần đây
- **Quick Actions**: Truy cập nhanh API Keys và Settings

## 2. QUẢN LÝ THANH TOÁN (Payment Management)

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  💰 PAYMENT MANAGEMENT                    [Filter] [Export] │
├─────────────────────────────────────────────────────────┤
│  🔍 SEARCH & FILTER                                     │
│  [Date Range] [Status] [Amount] [Customer] [Search...]  │
├─────────────────────────────────────────────────────────┤
│  📋 TRANSACTION LIST                                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ID     │ Amount │ Status  │ Customer │ Time     │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ #1234  │ $25.00 │ Success │ John D.  │ 2 min   │    │
│  │ #1233  │ $50.00 │ Success │ Jane S.  │ 5 min   │    │
│  │ #1232  │ $15.00 │ Failed  │ Bob W.   │ 10 min  │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  📊 PAYMENT STATISTICS                                  │
│  • Total Revenue: $12,450.00                           │
│  • Success Rate: 98.5%                                 │
│  • Average Transaction: $28.50                         │
│  • Commission Earned: $311.25                          │
└─────────────────────────────────────────────────────────┘
```

### Tính năng:
- **Advanced Filtering**: Lọc theo ngày, trạng thái, số tiền, khách hàng
- **Transaction History**: Lịch sử giao dịch chi tiết
- **Export Data**: Xuất dữ liệu CSV/Excel
- **Real-time Updates**: Cập nhật real-time qua WebSocket
- **Refund Management**: Xử lý hoàn tiền

## 3. CÀI ĐẶT MERCHANT (Merchant Settings)

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ MERCHANT SETTINGS                                   │
├─────────────────────────────────────────────────────────┤
│  🏢 BUSINESS INFORMATION                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Merchant Name: [Coffee Shop ABC]                │    │
│  │ Business Type: [Retail]                         │    │
│  │ Email: [merchant@coffeeshop.com]                │    │
│  │ Phone: [+1-555-0123]                            │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  🏦 SETTLEMENT SETTINGS                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Settlement Period: [Daily ▼]                   │    │
│  │ Commission Rate: 2.5%                          │    │
│  │ Next Settlement: Tomorrow 9:00 AM              │    │
│  │ Bank Account: ****1234                          │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  🔑 API CONFIGURATION                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Public Key: pk_live_abc123...                   │    │
│  │ Secret Key: [••••••••••••••••] [Show] [Regenerate]│    │
│  │ Webhook URL: https://merchant.com/webhook       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Các phần chính:
- **Business Info**: Thông tin doanh nghiệp
- **Settlement**: Cài đặt thanh toán (daily/weekly/monthly)
- **API Keys**: Quản lý API keys
- **Webhook**: Cấu hình webhook notifications

## 4. TERMINAL NFC (NFC Terminal Interface)

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  📱 NFC PAYMENT TERMINAL                                │
├─────────────────────────────────────────────────────────┤
│  💳 CARD READER                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [NFC ICON]                                     │    │
│  │  TAP CARD TO PAY                                │    │
│  │  Amount: $25.00                                 │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  ⚡ QUICK AMOUNTS                                       │
│  [ $5 ] [ $10 ] [ $25 ] [ $50 ] [ $100 ] [ Custom ]    │
├─────────────────────────────────────────────────────────┤
│  📊 TRANSACTION STATUS                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Status: Waiting for card...                     │    │
│  │ Last Transaction: #1234 - $25.00 - Success      │    │
│  │ Terminal ID: TERM-001                           │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Tính năng:
- **NFC Card Reader**: Đọc thẻ NFC trực tiếp
- **Quick Amounts**: Các mức tiền phổ biến
- **Custom Amount**: Nhập số tiền tùy chỉnh
- **Real-time Status**: Trạng thái giao dịch real-time
- **Transaction History**: Lịch sử giao dịch gần đây

## 5. BÁO CÁO & THỐNG KÊ (Reports & Analytics)

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  📊 REPORTS & ANALYTICS                    [Export] [Print] │
├─────────────────────────────────────────────────────────┤
│  📈 REVENUE CHART                                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │     $500 ┤                                     │    │
│  │     $400 ┤     ●                               │    │
│  │     $300 ┤   ●   ●                             │    │
│  │     $200 ┤ ●       ●                           │    │
│  │     $100 ●           ●                         │    │
│  │       0 └─────────────────────────────────────│    │
│  │         Mon Tue Wed Thu Fri Sat Sun            │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  📋 SUMMARY REPORTS                                     │
│  • Daily Revenue: $1,250.00                           │
│  • Weekly Revenue: $8,750.00                          │
│  • Monthly Revenue: $37,500.00                        │
│  • Top Transaction: $500.00                           │
│  • Average Order Value: $28.50                        │
└─────────────────────────────────────────────────────────┘
```

### Tính năng:
- **Revenue Charts**: Biểu đồ doanh thu theo ngày/tuần/tháng
- **Performance Metrics**: Các chỉ số hiệu suất
- **Export Reports**: Xuất báo cáo PDF/Excel
- **Custom Date Ranges**: Chọn khoảng thời gian tùy chỉnh

## 6. QUẢN LÝ API KEYS (API Key Management)

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  🔑 API KEY MANAGEMENT                                  │
├─────────────────────────────────────────────────────────┤
│  📋 ACTIVE API KEYS                                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Key Name    │ Type    │ Last Used │ Actions     │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ Terminal-01 │ Live    │ 2 min ago │ [View][Revoke]│    │
│  │ Test-Key    │ Test    │ Never     │ [View][Revoke]│    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  ➕ CREATE NEW API KEY                                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Key Name: [Terminal-02]                         │    │
│  │ Environment: [Live ▼]                           │    │
│  │ Permissions: [Payment] [Refund] [Read]          │    │
│  │ [Generate Key]                                  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Tính năng:
- **Key Management**: Tạo, xem, thu hồi API keys
- **Permission Control**: Phân quyền cho từng key
- **Environment Separation**: Tách biệt test/live keys
- **Usage Tracking**: Theo dõi sử dụng API keys

## 7. WEBHOOK MANAGEMENT

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  🔗 WEBHOOK MANAGEMENT                                  │
├─────────────────────────────────────────────────────────┤
│  📡 CONFIGURED WEBHOOKS                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │ URL: https://merchant.com/webhook               │    │
│  │ Events: payment.success, payment.failed         │    │
│  │ Status: ✅ Active                               │    │
│  │ Last Trigger: 2 min ago                         │    │
│  │ [Edit] [Test] [Delete]                          │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  📝 WEBHOOK LOGS                                       │
│  • payment.success - 200 OK - 2 min ago               │
│  • payment.failed - 500 Error - 5 min ago             │
│  • payment.success - 200 OK - 10 min ago              │
└─────────────────────────────────────────────────────────┘
```

### Tính năng:
- **Webhook Configuration**: Cấu hình URL và events
- **Event Types**: payment.success, payment.failed, refund.completed
- **Testing**: Test webhook endpoints
- **Logs**: Xem lịch sử webhook calls
- **Retry Logic**: Tự động retry khi failed

## 8. TÍNH NĂNG KỸ THUẬT

### Authentication
- **API Key Authentication**: X-API-Key header
- **JWT Token**: Cho admin functions
- **Rate Limiting**: Giới hạn request per API key
- **Permission-based Access**: Phân quyền chi tiết

### Payment Processing
- **Real-time NFC Processing**: Xử lý thanh toán NFC real-time
- **Payment Intent Flow**: Tạo intent trước khi confirm
- **Transaction Confirmation**: Xác nhận giao dịch
- **Refund Management**: Quản lý hoàn tiền
- **PIN Verification**: Xác thực PIN cho giao dịch lớn

### Real-time Features
- **WebSocket Integration**: Cập nhật real-time
- **Live Transaction Updates**: Cập nhật giao dịch live
- **Status Notifications**: Thông báo trạng thái
- **Error Handling**: Xử lý lỗi real-time

### Integration
- **REST API**: API endpoints đầy đủ
- **Webhook Support**: Webhook notifications
- **SDK Support**: SDK cho các ngôn ngữ phổ biến
- **Documentation**: API documentation chi tiết

## 9. RESPONSIVE DESIGN

### Mobile Optimization
- **Touch-friendly Interface**: Giao diện thân thiện với touch
- **Swipe Gestures**: Cử chỉ vuốt
- **Mobile Navigation**: Điều hướng mobile
- **Offline Support**: Hỗ trợ offline

### Tablet Support
- **Larger Screens**: Tối ưu cho màn hình lớn
- **Multi-panel Layout**: Layout nhiều panel
- **Touch & Mouse**: Hỗ trợ cả touch và mouse

## 10. SECURITY FEATURES

### Data Protection
- **Encryption**: Mã hóa dữ liệu
- **HTTPS Only**: Chỉ sử dụng HTTPS
- **API Key Rotation**: Xoay API keys định kỳ
- **Audit Logs**: Logs kiểm tra

### Access Control
- **Role-based Access**: Phân quyền theo vai trò
- **IP Whitelisting**: Chỉ định IP được phép
- **Session Management**: Quản lý phiên đăng nhập
- **Two-factor Authentication**: Xác thực 2 yếu tố

---

## Kết luận

Giao diện merchant được thiết kế để cung cấp trải nghiệm người dùng tối ưu cho việc quản lý thanh toán NFC. Với các tính năng real-time, bảo mật cao và tích hợp API mạnh mẽ, merchant có thể dễ dàng tích hợp và quản lý hệ thống thanh toán của mình.

**Tác giả**: NFC Payment System Team  
**Ngày tạo**: 2024  
**Phiên bản**: 1.0.0
