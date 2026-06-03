# Razorpay Integration Setup

## 1. Install Razorpay Package

```bash
cd backend
npm install razorpay
```

## 2. Add Environment Variables

Add these to your `backend/.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## 3. Get Razorpay Credentials

### For Testing (Test Mode):
1. Go to https://dashboard.razorpay.com/signup
2. Sign up for a Razorpay account
3. Navigate to Settings → API Keys
4. Generate Test API Keys
5. Copy the **Key ID** and **Key Secret**

### Test Credentials (Use these for development):
- **Test Key ID**: Available after signup
- **Test Key Secret**: Available after signup

### Test Cards for Payment Testing:
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

## 4. Coffee Pricing

Current pricing: **₹50 per coffee**

You can modify this in `backend/src/controllers/paymentController.js`:
```javascript
const COFFEE_PRICE = 50; // Change this value
```

## 5. Razorpay Dashboard

Access your dashboard at: https://dashboard.razorpay.com/

### What you can do:
- View all transactions
- Issue refunds
- Download reports
- Set up webhooks
- Configure payment methods

## 6. Payment Flow

```
1. User clicks "Buy Me a Coffee" button
2. Frontend calls /api/payments/create-order
3. Backend creates Razorpay order
4. Frontend opens Razorpay checkout modal
5. User completes payment
6. Razorpay sends payment details to frontend
7. Frontend calls /api/payments/verify
8. Backend verifies signature and updates payment status
9. Creator receives notification
```

## 7. Security Features

✅ **Signature Verification**: All payments are verified using HMAC SHA256
✅ **Server-side Validation**: Amount and order details verified on backend
✅ **Secure Keys**: API keys stored in environment variables
✅ **Payment Status Tracking**: Pending → Completed → Failed states
✅ **Refund Support**: Built-in refund capability

## 8. Features Implemented

### Backend:
- ✅ Create Razorpay order
- ✅ Verify payment signature
- ✅ Track payment status
- ✅ Get received payments (creator view)
- ✅ Get sent payments (supporter view)
- ✅ Get public supporters list
- ✅ Payment statistics and analytics
- ✅ Anonymous support option
- ✅ Public/private support toggle
- ✅ Notification system integration

### Database:
- ✅ Payment model with all necessary fields
- ✅ Indexed queries for performance
- ✅ Support for multiple currencies (INR, USD)
- ✅ Message support (supporters can leave messages)

## 9. API Endpoints

```
POST   /api/payments/create-order      Create Razorpay order
POST   /api/payments/verify            Verify payment signature
GET    /api/payments/received          Get payments received (creator)
GET    /api/payments/sent              Get payments sent (supporter)
GET    /api/payments/supporters/:id    Get public supporters
GET    /api/payments/stats             Get payment statistics
```

## 10. Next Steps

After backend setup, you need to:
1. ✅ Install Razorpay package: `npm install razorpay`
2. ✅ Add environment variables to `.env`
3. ⏳ Create frontend components
4. ⏳ Integrate Razorpay checkout
5. ⏳ Add coffee button to profiles
6. ⏳ Create supporter dashboard

## 11. Testing Checklist

- [ ] Create order successfully
- [ ] Complete payment with test card
- [ ] Verify payment signature
- [ ] Check payment status in database
- [ ] Verify notification sent to creator
- [ ] Test anonymous support
- [ ] Test public/private toggle
- [ ] View received payments
- [ ] View sent payments
- [ ] Check payment statistics

## 12. Production Deployment

Before going live:
1. Switch to Live API Keys (not Test Keys)
2. Enable required payment methods in Razorpay dashboard
3. Set up webhooks for payment status updates
4. Configure settlement schedule
5. Add GST/Tax details if required
6. Test with real small amounts
7. Set up monitoring and alerts

## 13. Razorpay Fees

**Pricing**: 2% + GST on domestic cards
**Settlement**: T+3 days (can be faster with instant settlement)
**Minimum**: No minimum transaction amount

## 14. Support

- Razorpay Docs: https://razorpay.com/docs/
- Support: support@razorpay.com
- Community: https://razorpay.com/community/
