@echo off
echo ===================================
echo     Quick MY_COIN Test (Windows)
echo ===================================
echo.

REM Update these values
set EMAIL=test5@gmail.com
set PASSWORD=Password123!
set RECIPIENT=0x58773b5f8c05bb80c6618fcaa7e175bcaa64a1ee6075e39fc2b91cd2da84907e
set AMOUNT=5

echo Step 1: Login
echo ------------------------
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%EMAIL%\",\"password\":\"%PASSWORD%\"}"

echo.
echo.
echo Copy the token from above response, then run:
echo.
echo Step 2: Check Balance (replace YOUR_TOKEN)
echo ------------------------
echo curl -X GET http://localhost:8080/api/payments/mycoin/balance ^
  -H "Authorization: Bearer YOUR_TOKEN"
echo.
echo Step 3: Send Payment (replace YOUR_TOKEN)
echo ------------------------
echo curl -X POST http://localhost:8080/api/payments/mycoin/test-payment ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"recipientAddress\":\"%RECIPIENT%\",\"amount\":%AMOUNT%}"
echo.
pause