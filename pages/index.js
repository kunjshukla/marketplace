import { useState, useEffect } from 'react';
import GoogleLogin from '../components/GoogleLogin';
import InrPurchaseModal from '../components/InrPurchaseModal';
import UsdPurchaseButton from '../components/UsdPurchaseButton';
import apiClient from '../lib/axios';

const HomePage = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNft, setSelectedNft] = useState(null);
  const [showInrModal, setShowInrModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchNfts();
    checkUser();
  }, []);

  const fetchNfts = async () => {
    try {
      const response = await apiClient.get('/api/nfts');
      setNfts(response.data.nfts || []);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError('Failed to load NFTs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkUser = () => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const handleInrPurchase = (nft) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      alert('Please login to make a purchase');
      return;
    }
    setSelectedNft(nft);
    setShowInrModal(true);
  };

  const getBadgeColor = (nft) => {
    if (nft.is_sold) return 'bg-red-500';
    if (nft.is_reserved) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getBadgeText = (nft) => {
    if (nft.is_sold) return 'SOLD';
    if (nft.is_reserved) return 'RESERVED';
    return 'AVAILABLE';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading NFTs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NFT Marketplace</h1>
              <p className="text-gray-600">Discover and collect unique digital assets</p>
            </div>
            <div className="flex items-center space-x-4">
              {user?.is_admin && (
                <a
                  href="/admin/verify"
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Admin Panel
                </a>
              )}
              <GoogleLogin />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {nfts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No NFTs available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <div key={nft.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={nft.image_url}
                    alt={nft.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${getBadgeColor(nft)}`}>
                      {getBadgeText(nft)}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{nft.title}</h3>
                  
                  {nft.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{nft.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <div className="flex space-x-4">
                        <span className="text-lg font-bold text-green-600">₹{nft.price_inr?.toLocaleString()}</span>
                        <span className="text-lg font-bold text-blue-600">${nft.price_usd}</span>
                      </div>
                    </div>
                  </div>

                  {!nft.is_sold && !nft.is_reserved && (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleInrPurchase(nft)}
                        className="w-full px-4 py-3 bg-secondary text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                      >
                        Buy with INR (₹{nft.price_inr?.toLocaleString()})
                      </button>
                      
                      <UsdPurchaseButton nft={nft} />
                    </div>
                  )}

                  {nft.is_sold && (
                    <div className="text-center py-3">
                      <span className="text-red-600 font-medium">This NFT has been sold</span>
                    </div>
                  )}

                  {nft.is_reserved && !nft.is_sold && (
                    <div className="text-center py-3">
                      <span className="text-yellow-600 font-medium">This NFT is temporarily reserved</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* INR Purchase Modal */}
      <InrPurchaseModal
        isOpen={showInrModal}
        onClose={() => setShowInrModal(false)}
        nft={selectedNft}
      />
    </div>
  );
};

export default HomePage;
