# ⚡ Quick Start - Razorpay Integration

## 🚀 5-Minute Setup

### Step 1: Install Razorpay Package
```bash
cd backend
npm install razorpay
```

### Step 2: Get Razorpay Test Keys

1. Go to: https://dashboard.razorpay.com/signup
2. Sign up (free, no credit card needed)
3. Navigate to: **Settings → API Keys**
4. Click **Generate Test Keys**
5. Copy both:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret**

### Step 3: Add Environment Variables

**Backend** - Add to `backend/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
```

**Frontend** - Create `frontend/.env`:
```env
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
```

### Step 4: Start Servers

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Step 5: Test It!

1. Open http://localhost:5173
2. Login to your account
3. Visit any user's profile
4. Click **"Buy Me a Coffee"** button
5. Select coffee count
6. Click **"Support Now"**
7. Use test card:
   ```
   Card: 4111 1111 1111 1111
   CVV: 123
   Expiry: 12/25
   ```
8. Complete payment
9. See success notification! ✅

---

## 🎯 What You'll See

### On Profile Page:
- ✅ "Buy Me a Coffee" button (sage green)
- ✅ "Supporters" tab showing top supporters

### In Modal:
- ✅ Coffee count selector
- ✅ Message input
- ✅ Anonymous option
- ✅ Public/private toggle
- ✅ Total amount display

### After Payment:
- ✅ Success toast notification
- ✅ Creator receives notification
- ✅ Supporter appears in leaderboard
- ✅ Payment saved in database

---

## 🐛 Troubleshooting

### Issue: "Failed to load payment gateway"
**Solution:** Check if `VITE_RAZORPAY_KEY_ID` is set in `frontend/.env`

### Issue: "Invalid payment signature"
**Solution:** Verify `RAZORPAY_KEY_SECRET` matches in `backend/.env`

### Issue: Payment not completing
**Solution:** Use test card `4111 1111 1111 1111` in test mode

### Issue: Button not showing
**Solution:** Make sure you're logged in and viewing another user's profile

---

## 📊 Check If It's Working

### Database Check:
```bash
# Connect to MongoDB
mongosh

# Use your database
use blogosphere

# Check payments
db.payments.find().pretty()
```

### API Check:
```bash
# Get payment stats
curl http://localhost:5000/api/payments/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 Customization

### Change Coffee Price:
Edit `backend/src/controllers/paymentController.js`:
```javascript
const COFFEE_PRICE = 50; // Change to any amount
```

### Change Button Color:
Edit `frontend/src/components/BuyMeCoffee.jsx`:
```javascript
className="bg-primary" // Change to any Tailwind color
```

---

## 🔥 Pro Tips

1. **Test Mode vs Live Mode**
   - Always use `rzp_test_` keys for development
   - Switch to `rzp_live_` keys only in production

2. **Razorpay Dashboard**
   - View all test transactions
   - Download reports
   - Test refunds

3. **Security**
   - Never commit `.env` files
   - Keep API keys secret
   - Use environment variables

4. **Testing**
   - Test with different amounts
   - Test anonymous donations
   - Test with messages

---

## ✅ Success Checklist

- [ ] Razorpay package installed
- [ ] Test keys obtained
- [ ] Environment variables set (backend & frontend)
- [ ] Servers running
- [ ] Button visible on profile
- [ ] Modal opens correctly
- [ ] Payment completes successfully
- [ ] Notification received
- [ ] Supporter shows in list
- [ ] Payment in database

---

## 🎉 You're Done!

Your "Buy Me a Coffee" feature is now live! 

**What's Next?**
- Test with different users
- Check the Supporters leaderboard
- View payment statistics
- Add to your resume! 📝

**Need Help?**
- Razorpay Docs: https://razorpay.com/docs/
- Razorpay Support: support@razorpay.com

---

## 📸 Screenshots for Resume/Portfolio

Take screenshots of:
1. Buy Me a Coffee button on profile
2. Payment modal with options
3. Razorpay checkout
4. Success notification
5. Supporters leaderboard
6. Payment statistics

**Perfect for showcasing your payment integration skills!** 🚀
