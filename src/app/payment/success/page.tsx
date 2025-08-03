'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [transactionData, setTransactionData] = useState<any>(null)

  useEffect(() => {
    const processPayment = async () => {
      try {
        const paymentId = searchParams.get('payment_id')
        const orderId = searchParams.get('order_id')
        const signature = searchParams.get('signature')
        const gateway = searchParams.get('gateway') || 'paypal'

        if (!paymentId || !orderId) {
          setStatus('error')
          return
        }

        let response
        if (gateway === 'razorpay' && signature) {
          // Handle Razorpay payment verification
          response = await fetch('/api/payment/razorpay/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_payment_id: paymentId,
              razorpay_order_id: orderId,
              razorpay_signature: signature,
            }),
          })
        } else {
          // Handle PayPal payment capture
          response = await fetch('/api/payment/paypal/capture', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: orderId,
            }),
          })
        }

        const data = await response.json()

        if (data.success) {
          setTransactionData(data)
          setStatus('success')
          
          // Trigger NFT minting
          await fetch('/api/nft/mint', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userEmail: searchParams.get('email'),
              nftId: data.nftId,
              transactionId: data.transactionId,
              amount: data.amount,
              currency: data.currency || 'USD',
            }),
          })
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.error('Payment processing error:', error)
        setStatus('error')
      }
    }

    processPayment()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="text-2xl font-bold text-white mt-8">Processing Payment...</h2>
          <p className="text-gray-400 mt-4">Please wait while we verify your payment</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 mx-auto mb-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Payment Failed</h2>
          <p className="text-gray-400 mb-8">
            There was an issue processing your payment. Please try again or contact support.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-20 h-20 mx-auto mb-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Payment Successful!</h2>
        <p className="text-gray-400 mb-8">
          Your NFT purchase has been completed successfully. Your NFT will be minted and available in your profile shortly.
        </p>
        
        {transactionData && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-white mb-4">Transaction Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Transaction ID:</span>
                <span className="text-white font-mono">{transactionData.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">NFT ID:</span>
                <span className="text-white">{transactionData.nftId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white">{transactionData.amount} {transactionData.currency || 'USD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400 capitalize">{transactionData.status}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => router.push('/profile')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View My NFTs
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
