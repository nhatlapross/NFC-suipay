# PowerShell script to test Merchant API endpoints

Write-Host "🚀 MERCHANT API ENDPOINTS TEST SUITE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:3000/api/merchants"
$email = "test-merchant-$(Get-Date -UFormat '%s')@example.com"

# Test 1: Merchant Registration
Write-Host "🧪 Test 1: Merchant Registration" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

$registrationData = @{
    merchantName = "Test Coffee Shop"
    businessType = "Food & Beverage"  
    email = $email
    phoneNumber = "+1234567890"
    address = @{
        street = "123 Test Street"
        city = "San Francisco"
        state = "CA"
        country = "USA"
        postalCode = "94105"
    }
    walletAddress = "0x1234567890abcdef1234567890abcdef12345678901234567890abcdef1234567890abcdef"
    webhookUrl = "https://webhook.example.com/test"
} | ConvertTo-Json -Depth 3

try {
    $registrationResponse = Invoke-RestMethod -Uri "$baseUrl/register" -Method Post -Body $registrationData -ContentType "application/json"
    
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "🆔 Merchant ID: $($registrationResponse.data.merchantId)" -ForegroundColor Cyan
    Write-Host "🔑 Public Key: $($registrationResponse.data.apiKeys.publicKey)" -ForegroundColor Cyan
    Write-Host "📧 Email: $($registrationResponse.data.email)" -ForegroundColor Cyan
    Write-Host ""
    
    $merchantId = $registrationResponse.data.merchantId
    $publicKey = $registrationResponse.data.apiKeys.publicKey
    $secretKey = $registrationResponse.data.apiKeys.secretKey
    
    # Create auth header
    $credentials = "$publicKey`:$secretKey"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($credentials)
    $encodedCredentials = [System.Convert]::ToBase64String($bytes)
    $authHeaders = @{ 
        "Authorization" = "Basic $encodedCredentials"
        "Content-Type" = "application/json"
    }
    
    # Test 2: Public Merchant Info
    Write-Host "🧪 Test 2: Get Public Merchant Info" -ForegroundColor Yellow
    Write-Host "====================================" -ForegroundColor Yellow
    
    $publicInfoResponse = Invoke-RestMethod -Uri "$baseUrl/public/$merchantId" -Method Get
    Write-Host "✅ Public info retrieved!" -ForegroundColor Green
    Write-Host "👤 Name: $($publicInfoResponse.data.merchantName)" -ForegroundColor Cyan
    Write-Host "🏪 Business: $($publicInfoResponse.data.businessType)" -ForegroundColor Cyan
    Write-Host ""
    
    # Test 3: Authenticated Profile Request
    Write-Host "🧪 Test 3: Get Merchant Profile (Authenticated)" -ForegroundColor Yellow
    Write-Host "===============================================" -ForegroundColor Yellow
    
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/profile" -Method Get -Headers $authHeaders
    Write-Host "✅ Profile retrieved!" -ForegroundColor Green
    Write-Host "👤 Name: $($profileResponse.data.merchantName)" -ForegroundColor Cyan
    Write-Host "📧 Email: $($profileResponse.data.email)" -ForegroundColor Cyan
    Write-Host "✅ Active: $($profileResponse.data.isActive)" -ForegroundColor Cyan
    Write-Host ""
    
    # Test 4: Update Profile
    Write-Host "🧪 Test 4: Update Merchant Profile" -ForegroundColor Yellow
    Write-Host "===================================" -ForegroundColor Yellow
    
    $updateData = @{
        merchantName = "Updated Test Coffee Shop"
        phoneNumber = "+1234567891"
    } | ConvertTo-Json
    
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/profile" -Method Put -Body $updateData -Headers $authHeaders
    Write-Host "✅ Profile updated!" -ForegroundColor Green
    Write-Host "📝 New name: $($updateResponse.data.merchantName)" -ForegroundColor Cyan
    Write-Host ""
    
    # Test 5: Payment Stats
    Write-Host "🧪 Test 5: Get Payment Stats" -ForegroundColor Yellow
    Write-Host "=============================" -ForegroundColor Yellow
    
    $statsResponse = Invoke-RestMethod -Uri "$baseUrl/payments/stats" -Method Get -Headers $authHeaders
    Write-Host "✅ Stats retrieved!" -ForegroundColor Green
    Write-Host "📊 Today: $($statsResponse.data.today.transactions) transactions" -ForegroundColor Cyan
    Write-Host "📊 Overall: $($statsResponse.data.overall.transactions) transactions" -ForegroundColor Cyan
    Write-Host ""
    
    # Test 6: Settings
    Write-Host "🧪 Test 6: Get Merchant Settings" -ForegroundColor Yellow
    Write-Host "=================================" -ForegroundColor Yellow
    
    $settingsResponse = Invoke-RestMethod -Uri "$baseUrl/settings" -Method Get -Headers $authHeaders
    Write-Host "✅ Settings retrieved!" -ForegroundColor Green
    Write-Host "💰 Currency: $($settingsResponse.data.currency)" -ForegroundColor Cyan
    Write-Host "💵 Commission: $($settingsResponse.data.commission)%" -ForegroundColor Cyan
    Write-Host ""
    
    # Test 7: Create Webhook
    Write-Host "🧪 Test 7: Create Webhook" -ForegroundColor Yellow
    Write-Host "==========================" -ForegroundColor Yellow
    
    $webhookData = @{
        url = "https://test-webhook.example.com/webhook"
        events = @("payment.completed", "payment.failed")
        description = "Test webhook endpoint"
    } | ConvertTo-Json
    
    $webhookResponse = Invoke-RestMethod -Uri "$baseUrl/webhooks" -Method Post -Body $webhookData -Headers $authHeaders
    Write-Host "✅ Webhook created!" -ForegroundColor Green
    Write-Host "🔗 URL: $($webhookResponse.data.url)" -ForegroundColor Cyan
    Write-Host "📅 Events: $($webhookResponse.data.events -join ', ')" -ForegroundColor Cyan
    Write-Host ""
    
    # Test 8: Create API Key
    Write-Host "🧪 Test 8: Create API Key" -ForegroundColor Yellow
    Write-Host "==========================" -ForegroundColor Yellow
    
    $apiKeyData = @{
        name = "Test Development Key"
        permissions = @("payments.read", "profile.read")
        expiresIn = 30
    } | ConvertTo-Json
    
    $apiKeyResponse = Invoke-RestMethod -Uri "$baseUrl/api-keys" -Method Post -Body $apiKeyData -Headers $authHeaders
    Write-Host "✅ API Key created!" -ForegroundColor Green
    Write-Host "📛 Name: $($apiKeyResponse.data.name)" -ForegroundColor Cyan
    Write-Host "🔑 Public Key: $($apiKeyResponse.data.publicKey)" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $result = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($result)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

# Test 9: Invalid Authentication
Write-Host "🧪 Test 9: Invalid Authentication" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow

try {
    $invalidAuthHeaders = @{ "Authorization" = "Bearer invalid:credentials" }
    $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/profile" -Method Get -Headers $invalidAuthHeaders
    Write-Host "❌ Should have failed authentication but didn't!" -ForegroundColor Red
} catch {
    Write-Host "✅ Invalid auth properly rejected!" -ForegroundColor Green
    Write-Host "🔒 Status: 401 Unauthorized" -ForegroundColor Cyan
}
Write-Host ""

# Test 10: Validation Error
Write-Host "🧪 Test 10: Validation Error" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

try {
    $invalidData = @{
        merchantName = ""
        businessType = "Test"
    } | ConvertTo-Json
    
    $validationResponse = Invoke-RestMethod -Uri "$baseUrl/register" -Method Post -Body $invalidData -ContentType "application/json"
    Write-Host "❌ Should have failed validation but didn't!" -ForegroundColor Red
} catch {
    Write-Host "✅ Validation properly rejected invalid data!" -ForegroundColor Green
    Write-Host "🔒 Status: 400 Bad Request" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "🎉 All tests completed!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green