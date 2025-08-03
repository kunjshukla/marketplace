'use client'

import { useState } from 'react'
import Script from 'next/script'

interface RazorpayButtonProps {
  amount: number
  nftId: string
  userInfo: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  onSuccess: (details: any) => void
  onError: (error: any) => void
}

declare global {
  interface Window {
    Razorpay?: any
  }
}

export default function RazorpayButton({ amount, nftId, userInfo, onSuccess, onError }: RazorpayButtonProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleScriptLoad = () => {
    setIsLoaded(true)
  }

  const handlePayment = async () => {
    if (!window.Razorpay) {
      onError(new Error('Razorpay not loaded'))
      return
    }

    setIsProcessing(true)

    try {
      // Create order
      const response = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftId,
          amount,
          currency: 'INR',
          userEmail: userInfo.email,
          userName: userInfo.name
        }),
      })

      const orderData = await response.json()

      if (!orderData.orderId) {
        throw new Error('Failed to create Razorpay order')
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'NFT Marketplace',
        description: `NFT Purchase - Token ID: ${nftId}`,
        order_id: orderData.orderId,
        prefill: {
          name: userInfo.name,
          email: userInfo.email,
          contact: userInfo.phone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                userEmail: userInfo.email,
                userName: userInfo.name,
                userAddress: userInfo.address,
                userPhone: userInfo.phone
              }),
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              onSuccess(verifyData)
            } else {
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Error verifying payment:', error)
            onError(error)
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      
      razorpay.on('payment.failed', (response: any) => {
        setIsProcessing(false)
        onError(new Error(response.error.description || 'Payment failed'))
      })

      razorpay.open()
    } catch (error) {
      console.error('Error initiating payment:', error)
      setIsProcessing(false)
      onError(error)
    }
  }

  return (
    <div className="space-y-4">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={handleScriptLoad}
      />
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Pay with Razorpay</h3>
        <div className="mb-4 p-4 bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300">NFT ID:</span>
            <span className="text-white font-mono">#{nftId}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-gray-300">Amount:</span>
            <span className="text-white font-semibold">₹{amount} INR</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-gray-300">Buyer:</span>
            <span className="text-white">{userInfo.name}</span>
          </div>
        </div>
        
        <button
          onClick={handlePayment}
          disabled={!isLoaded || isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          {!isLoaded ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Loading Razorpay...
            </>
          ) : isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            'Pay with Razorpay'
          )}
        </button>
      </div>
    </div>
  )
}
