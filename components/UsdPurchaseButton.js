import { useState } from 'react';
import apiClient from '../lib/axios';

const UsdPurchaseButton = ({ nft }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setError('Please login to make a purchase');
        setLoading(false);
        return;
      }

      const response = await apiClient.post(`/api/purchase/usd/${nft.id}`);
      
      if (response.data && response.data.approval_url) {
        // Redirect to PayPal
        window.location.href = response.data.approval_url;
      } else {
        throw new Error('No approval URL received');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setError(
        error.response?.data?.detail || 
        'Purchase failed. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handlePurchase}
        disabled={loading || nft.is_sold || nft.is_reserved}
        className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
          nft.is_sold || nft.is_reserved
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : loading
            ? 'bg-blue-400 text-white cursor-not-allowed'
            : 'bg-primary text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : nft.is_sold ? (
          <span>Sold Out</span>
        ) : nft.is_reserved ? (
          <span>Reserved</span>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-.635 4.005c-.08.517-.525.901-1.05.901zm2.19-14.401h2.19c2.403 0 4.19-.897 4.67-3.707.096-.558.054-1.005-.098-1.339-.255-.558-.87-.888-2.19-.888H8.264L7.266 6.936z"/>
            </svg>
            <span>Pay with PayPal</span>
            <span className="text-sm opacity-90">${nft.price_usd}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default UsdPurchaseButton;
