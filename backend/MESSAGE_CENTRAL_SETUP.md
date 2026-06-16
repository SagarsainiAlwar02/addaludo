# Message Central OTP Integration

## Updated Endpoints

The server now uses **Message Central API** instead of Fast2SMS for OTP verification.

### 1. Send OTP Endpoint

**POST** `/api/otp/send`

**Request Body:**
```json
{
  "countryCode": "91",
  "mobileNumber": "9999999999",
  "messageText": "Hello user, your login security code token entry is 123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "verificationId": "verification_id_from_api",
  "transactionId": "transaction_id_from_api",
  "message": "OTP sent successfully",
  "data": { ... }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message",
  "data": { ... }
}
```

---

### 2. Verify OTP Endpoint

**POST** `/api/otp/verify`

**Request Body:**
```json
{
  "verificationId": "verification_id_from_send_response",
  "code": "123456",
  "mobileNumber": "9999999999",
  "referralCode": "optional_referral_code"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP verified successfully and user logged in",
  "token": "jwt_token",
  "isNewUser": true/false,
  "user": {
    "id": "user_id",
    "_id": "user_id",
    "name": "Player123",
    "phone": "9999999999",
    "referralCode": "BA-123456",
    "referredBy": null,
    "role": "user",
    "status": "active"
  },
  "wallet": {
    "userId": "user_id",
    "balance": 0,
    "bonus": 0,
    "winnings": 0,
    "referralBalance": 0,
    "locked": 0
  },
  "data": { ... }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message",
  "data": { ... }
}
```

---

## Required Environment Variables

Add these to your `.env` file:

```env
# Message Central API Configuration
MC_BASE_URL=https://messagecentral.com
MC_AUTH_TOKEN=your_message_central_auth_token
MC_CUSTOMER_ID=your_customer_id
MC_SENDER_ID=UTOMOB

# Existing variables
MONGO_URI=mongodb://...
JWT_SECRET=your_jwt_secret
PORT=5000
```

---

## Key Features

✅ **Message Central Integration**: Uses the official Message Central API for OTP delivery  
✅ **Session Management**: Stores verification IDs with 5-minute expiration  
✅ **Attempt Limiting**: Limits verification attempts to 5 per session  
✅ **User Auto-Creation**: Automatically creates new users on successful OTP verification  
✅ **Referral Support**: Supports referral codes during signup  
✅ **Wallet Creation**: Automatically creates user wallet on first login  

---

## Migration Notes

### Removed Endpoints
- ❌ `/api/send-otp` (old Fast2SMS endpoint)
- ❌ `/api/otp-login` (old OTP login endpoint)

### New Endpoints
- ✅ `/api/otp/send` (Message Central OTP send)
- ✅ `/api/otp/verify` (Message Central OTP verification with auto-login)

---

## Testing with cURL

**Step 1: Send OTP**
```bash
curl -X POST http://localhost:5000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "countryCode": "91",
    "mobileNumber": "9999999999",
    "messageText": "Your verification code is ##var1##"
  }'
```

**Step 2: Verify OTP**
```bash
curl -X POST http://localhost:5000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "verification_id_from_step_1",
    "code": "123456",
    "mobileNumber": "9999999999"
  }'
```

---

## Error Codes

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | Missing mobileNumber | Phone number not provided |
| 400 | Invalid phone number format | Phone not 10 digits |
| 400 | OTP session not found | OTP expired or never sent |
| 400 | OTP expired | More than 5 minutes have passed |
| 429 | Too many verification attempts | More than 5 failed attempts |
| 403 | Account blocked | User account is blocked |
| 500 | Server error | Internal server error |
