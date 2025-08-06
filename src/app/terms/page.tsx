import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6">
              By accessing and using the Sanatani NFT Marketplace ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Description of Service</h2>
            <p className="mb-6">
              Our Service provides a platform for buying, selling, and trading non-fungible tokens (NFTs) with a focus on Sanatani cultural and spiritual themes.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. User Responsibilities</h2>
            <ul className="list-disc pl-6 mb-6">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must not use the Service for illegal activities</li>
              <li>You must respect intellectual property rights</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Payment and Fees</h2>
            <p className="mb-6">
              Transaction fees may apply to purchases and sales on our platform. All fees will be clearly displayed before you complete a transaction.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Intellectual Property</h2>
            <p className="mb-6">
              Users retain ownership of their NFTs. Our platform and its content are protected by copyright and other intellectual property laws.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Disclaimer</h2>
            <p className="mb-6">
              The Service is provided "as is" without warranty of any kind. We do not guarantee the value or authenticity of NFTs traded on our platform.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Contact Information</h2>
            <p className="mb-6">
              If you have any questions about these Terms of Service, please contact us at support@sanatani-nft.com
            </p>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
