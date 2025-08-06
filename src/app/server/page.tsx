import { Suspense } from 'react';
import Image from "next/image";
import Link from "next/link";

// Server component to fetch NFT data
async function getNFTs() {
  try {
    const response = await fetch('http://localhost:8000/api/nfts?limit=8', {
      cache: 'no-store' // Always fetch fresh data
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}

function NFTCard({ nft }: any) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
      <div className="relative h-80 overflow-hidden">
        <img
          src={nft.image_url}
          alt={nft.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
          {nft.title}
        </h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {nft.description}
        </p>
        <div className="flex justify-between items-center mb-4">
          <div className="text-green-400 font-semibold">
            ${nft.price_usd}
          </div>
          <div className="text-blue-400 font-semibold">
            ₹{nft.price_inr}
          </div>
        </div>
        <Link 
          href={`/nft/${nft.id}`}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 block text-center"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

async function NFTGrid() {
  const nfts = await getNFTs();
  
  if (nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">
          Unable to load NFTs from backend
        </div>
        <div className="text-gray-500 text-sm">
          Please ensure the FastAPI backend is running on localhost:8000
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {nfts.map((nft: any) => (
        <NFTCard key={nft.id} nft={nft} />
      ))}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 animate-pulse">
          <div className="h-80 bg-gray-700"></div>
          <div className="p-6">
            <div className="h-6 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded mb-4"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ServerHomePage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-6">Buy NFTs with PayPal &amp; Razorpay</h1>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto mb-8">
              No wallet needed! Purchase amazing NFTs directly with PayPal (USD) or Razorpay (INR). 
              Instant delivery, secure payments, and automatic NFT minting to your profile.
            </p>
            <div className="flex justify-center space-x-4 mb-8">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm text-purple-200 mb-1">💳 PayPal</div>
                <div className="font-semibold">Pay in USD</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm text-purple-200 mb-1">🇮🇳 Razorpay</div>
                <div className="font-semibold">Pay in INR</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm text-purple-200 mb-1">⚡ Instant</div>
                <div className="font-semibold">NFT Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Gallery */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">Featured NFTs</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Discover unique digital art from our collection. Each NFT is carefully crafted and available for instant purchase.
            </p>
          </div>
          
          <Suspense fallback={<LoadingGrid />}>
            <NFTGrid />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
