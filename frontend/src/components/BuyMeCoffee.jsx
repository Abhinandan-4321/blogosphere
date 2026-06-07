import { useState } from 'react'
import { Coffee, X, Loader2, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { paymentAPI } from '../services/api'
import { showToast } from '../utils/toast'
import { useAuth } from '../context/AuthContext'

const COFFEE_PRICE = 50

export default function BuyMeCoffee({ creator, onSuccess, requireAuth = true }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [coffeeCount, setCoffeeCount] = useState(1)
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)

  // Default creator info for Landing page (you can customize this)
  const defaultCreator = {
    _id: process.env.VITE_DEFAULT_CREATOR_ID || 'default',
    name: 'Abhinandan Gupta',
  }

  const actualCreator = creator || defaultCreator

  const handleBuyCoffee = async () => {
    if (!user) {
      showToast.error('Please login to support creators')
      navigate('/login')
      return
    }

    if (user && creator && user._id === creator._id) {
      showToast.error('You cannot support yourself')
      return
    }

    setLoading(true)

    try {
      // Create order
      const { data: orderData } = await paymentAPI.createOrder({
        creatorId: actualCreator._id,
        coffeeCount,
        message: message.trim(),
        isAnonymous,
        isPublic,
      })

      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)

      script.onload = () => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: 'Blogosphere',
          description: `${coffeeCount} Coffee${coffeeCount > 1 ? 's' : ''} for ${actualCreator.name}`,
          order_id: orderData.data.orderId,
          handler: async (response) => {
            try {
              // Verify payment
              await paymentAPI.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: orderData.data.paymentId,
              })

              showToast.success(`Successfully bought ${coffeeCount} coffee${coffeeCount > 1 ? 's' : ''}!`)
              setIsOpen(false)
              setCoffeeCount(1)
              setMessage('')
              onSuccess?.()
            } catch (error) {
              showToast.error('Payment verification failed')
            } finally {
              setLoading(false)
            }
          },
          prefill: user ? {
            name: user.name,
            email: user.email,
          } : {},
          theme: {
            color: '#6B7C59',
          },
          modal: {
            ondismiss: () => {
              setLoading(false)
            },
          },
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
      }

      script.onerror = () => {
        showToast.error('Failed to load payment gateway')
        setLoading(false)
      }
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to create order')
      setLoading(false)
    }
  }

  const totalAmount = coffeeCount * COFFEE_PRICE

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:bg-primary-container hover:text-on-primary-container"
      >
        <Coffee className="h-4 w-4" />
        Buy Me a Coffee
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-on-surface-variant transition hover:bg-surface-container-high"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container">
                  <Coffee className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">Buy Me a Coffee</h3>
                  <p className="text-sm text-on-surface-variant">Support {actualCreator.name}</p>
                </div>
              </div>
            </div>

            {/* Coffee Count Selector */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-on-surface">
                Number of Coffees
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCoffeeCount(Math.max(1, coffeeCount - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-on-surface transition hover:bg-surface-container-high"
                  disabled={coffeeCount <= 1}
                >
                  -
                </button>
                <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-4 py-2">
                  <Coffee className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold text-on-surface">×{coffeeCount}</span>
                </div>
                <button
                  onClick={() => setCoffeeCount(Math.min(100, coffeeCount + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-on-surface transition hover:bg-surface-container-high"
                  disabled={coffeeCount >= 100}
                >
                  +
                </button>
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">₹{COFFEE_PRICE} per coffee</p>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-on-surface">
                Leave a message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say something nice..."
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface outline-none placeholder-on-surface-variant/50 transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <p className="mt-1 text-xs text-on-surface-variant">{message.length}/500</p>
            </div>

            {/* Options */}
            <div className="mb-6 space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-sm text-on-surface">Support anonymously</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-sm text-on-surface">Show in public supporters list</span>
              </label>
            </div>

            {/* Total */}
            <div className="mb-6 rounded-lg bg-primary-container/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface">Total Amount</span>
                <span className="text-2xl font-bold text-primary">₹{totalAmount}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-xl border border-outline-variant px-4 py-3 text-sm font-medium text-on-surface transition hover:bg-surface-container-high"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleBuyCoffee}
                disabled={loading}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-on-primary transition hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Heart className="h-4 w-4" />
                    Support Now
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
