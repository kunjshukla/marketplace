'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UserInfoForm from './UserInfoForm'
import PayPalButton from './PayPalButton'
import RazorpayButton from './RazorpayButton'

interface PaymentFlowProps {
  nftId: string
  priceUSD: number
  priceINR: number
  onClose?: () => void
}

type Step = 'info' | 'payment' | 'processing' | 'success'
type PaymentMethod = 'paypal' | 'razorpay'

export default function PaymentFlow({ nftId, priceUSD, priceINR, onClose }: PaymentFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('info')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal')
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleUserInfoSubmit = (info: {
    name: string
    email: string
    phone?: string
    address?: string
  }) => {
    setUserInfo({
      name: info.name,
      email: info.email,
      phone: info.phone || '',
      address: info.address || ''
    })
    setStep('payment')
  }

  const handlePaymentSuccess = (details: any) => {
    setStep('success')
    
    // Redirect to success page with transaction details
    setTimeout(() => {
      const params = new URLSearchParams({
        payment_id: details.transactionId,
        order_id: details.orderId || details.transactionId,
        nft_id: details.nftId,
        amount: details.amount.toString(),
        status: 'success',
        gateway: paymentMethod,
        email: userInfo.email
      })
      
      router.push(`/payment/success?${params.toString()}`)
    }, 2000)
  }

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error)
    alert(`Payment failed: ${error.message || 'Unknown error'}`)
    setStep('payment')
  }

  const handleBack = () => {
    if (step === 'payment') {
      setStep('info')
    } else if (onClose) {
      onClose()
    }
  }

  if (step === 'success') {
    return (
      <div className="text-center p-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">Payment Successful!</h3>
        <p className="text-gray-400 mb-6">
          Your NFT purchase has been completed. You will be redirected to the success page shortly.
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          {step !== 'info' && (
            <button
              onClick={handleBack}
              className="mr-4 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-2xl font-bold text-white">
            {step === 'info' ? 'Your Information' : 'Payment Method'}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step === 'info' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {step === 'info' ? '1' : '✓'}
        </div>
        <div className={`flex-1 h-1 mx-4 ${
          step === 'info' ? 'bg-gray-600' : 'bg-green-600'
        }`}></div>
        <div className={(() => {
          const currentStep = step as Step
          if (currentStep === 'payment' || currentStep === 'processing') return 'flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white'
          if (currentStep === 'success') return 'flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white'
          return 'flex items-center justify-center w-8 h-8 rounded-full bg-gray-600 text-gray-400'
        })()}>
          {(() => {
            const currentStep = step as Step
            if (currentStep === 'success') return '✓'
            return '2'
          })()}
        </div>
      </div>

      {/* NFT Details Card */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">NFT Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">NFT ID:</span>
            <span className="text-white font-mono ml-2">#{nftId}</span>
          </div>
          <div>
            <span className="text-gray-400">Price USD:</span>
            <span className="text-white font-semibold ml-2">${priceUSD}</span>
          </div>
          <div>
            <span className="text-gray-400">Price INR:</span>
            <span className="text-white font-semibold ml-2">₹{priceINR}</span>
          </div>
          <div>
            <span className="text-gray-400">Type:</span>
            <span className="text-white ml-2">Digital Collectible</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {step === 'info' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-400 mb-6">
            Please provide your information to proceed with the NFT purchase.
          </p>
          <UserInfoForm 
            onSubmit={handleUserInfoSubmit} 
            isLoading={isLoading}
          />
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'paypal' 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-white font-semibold mb-1">PayPal</div>
                  <div className="text-sm text-gray-400">${priceUSD} USD</div>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'razorpay' 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-white font-semibold mb-1">Razorpay</div>
                  <div className="text-sm text-gray-400">₹{priceINR} INR</div>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Component */}
          {paymentMethod === 'paypal' ? (
            <PayPalButton
              amount={priceUSD}
              nftId={nftId}
              userInfo={userInfo}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          ) : (
            <RazorpayButton
              amount={priceINR}
              nftId={nftId}
              userInfo={userInfo}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </div>
      )}
    </div>
  )
}
