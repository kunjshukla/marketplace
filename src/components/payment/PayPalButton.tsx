'use client'

import { useState } from 'react'
import Script from 'next/script'

interface PayPalButtonProps {
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
    paypal?: any
  }
}

export default function PayPalButton({ amount, nftId, userInfo, onSuccess, onError }: PayPalButtonProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  
  if (!paypalClientId) {
    return (
      <div className="bg-red-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2">PayPal Configuration Error</h3>
        <p className="text-red-200">PayPal Client ID is not configured. Please check your environment variables.</p>
      </div>
    )
  }

  const handleScriptLoad = () => {
    console.log('PayPal script loaded, client ID:', process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)
    setIsLoaded(true)
    
    if (window.paypal) {
      console.log('PayPal object found, rendering buttons...')
      window.paypal.Buttons({
        createOrder: async () => {
          try {
            const response = await fetch('/api/payment/paypal/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                nftId,
                amount,
                currency: 'USD'
              }),
            })

            const data = await response.json()
            
            if (data.orderId) {
              return data.orderId
            } else {
              throw new Error('Failed to create PayPal order')
            }
          } catch (error) {
            console.error('Error creating PayPal order:', error)
            onError(error)
            throw error
          }
        },
        
        onApprove: async (data: any) => {
          try {
            const response = await fetch('/api/payment/paypal/capture', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: data.orderID,
                userEmail: userInfo.email,
                userName: userInfo.name,
                userAddress: userInfo.address
              }),
            })

            const details = await response.json()
            
            if (details.success) {
              onSuccess(details)
            } else {
              throw new Error(details.error || 'Payment capture failed')
            }
          } catch (error) {
            console.error('Error capturing PayPal payment:', error)
            onError(error)
          }
        },
        
        onError: (err: any) => {
          console.error('PayPal error:', err)
          onError(err)
        },
        
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal'
        }
      }).render('#paypal-button-container')
    }
  }

  return (
    <div className="space-y-4">
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`}
        onLoad={handleScriptLoad}
        onError={(e) => {
          console.error('PayPal script failed to load:', e)
          onError(new Error('PayPal script failed to load'))
        }}
      />
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Pay with PayPal</h3>
        <div className="mb-4 p-4 bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300">NFT ID:</span>
            <span className="text-white font-mono">#{nftId}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-gray-300">Amount:</span>
            <span className="text-white font-semibold">${amount} USD</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-gray-300">Buyer:</span>
            <span className="text-white">{userInfo.name}</span>
          </div>
        </div>
        
        {!isLoaded && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Loading PayPal...</span>
          </div>
        )}
        
        <div id="paypal-button-container" className={isLoaded ? '' : 'hidden'}></div>
      </div>
    </div>
  )
}
