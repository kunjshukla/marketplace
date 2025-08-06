"use client";

import { useState, useEffect, useMemo } from "react";
import { nfts } from "@/data/nfts";
import Image from "next/image";
import Link from "next/link";
import { MARKETPLACE_CONTRACTS } from "@/consts/marketplace_contract";

// Types for API response
interface NFTData {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  price_inr: number;
  price_usd: number;
  is_sold: boolean;
  is_reserved: boolean;
  contract_address: string;
  token_id: number;
}

interface DisplayNFT extends NFTData {
  name: string;
  image: string;
  rarity: string;
  collection: string;
  chainId: string;
  contractAddress: string;
  tokenId: string;
}

export default function Home() {
  const [apiNFTs, setApiNFTs] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch NFTs from FastAPI backend via Next.js API route
  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setLoading(true);
        console.log('Fetching NFTs from API route...');
        
        const response = await fetch('/api/nfts?limit=8');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        if (data.success && data.data) {
          setApiNFTs(data.data);
          console.log('NFTs loaded successfully:', data.data.length);
        } else {
          throw new Error(data.error || 'Failed to fetch NFTs');
        }
      } catch (err) {
        console.error('Error fetching NFTs:', err);
        setError('Failed to load NFTs from server');
        // Fallback to static data
        setApiNFTs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, []);

  // Use API NFTs if available, otherwise fallback to static data
  const displayNFTs = useMemo(() => {
    if (apiNFTs.length > 0) {
      return apiNFTs.map(nft => ({
        ...nft,
        name: nft.title,
        image: nft.image_url,
        rarity: 'Common', // Default rarity since API doesn't provide this
        collection: 'NFT Marketplace',
        chainId: '1', // Default chain ID
        contractAddress: nft.contract_address || MARKETPLACE_CONTRACTS[0]?.address || '0x0',
        tokenId: nft.token_id?.toString() || '0'
      }));
    }
    // For static NFTs, add the missing properties
    return nfts.slice(0, 8).map(nft => ({
      ...nft,
      price_inr: 49, // Default price
      price_usd: 0.59, // Default price
      is_sold: false,
      is_reserved: false
    }));
  }, [apiNFTs]);

  // Helper function to check if NFT is from API (has API properties)
  const isApiNFT = (nft: any): nft is DisplayNFT => {
    return 'price_inr' in nft && 'is_sold' in nft && 'is_reserved' in nft;
  };
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-6">
              Buy NFTs with PayPal &  
            </h1>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto mb-8">
              No wallet needed! Purchase amazing NFTs directly with PayPal (USD) or   (INR). 
              Instant delivery, secure payments, and automatic NFT minting to your profile.
            </p>
            <div className="flex justify-center space-x-4 mb-8">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm text-purple-200 mb-1">💳 PayPal</div>
                <div className="font-semibold">Pay in USD</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-sm text-purple-200 mb-1">🇮🇳  </div>
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

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Featured Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">Featured NFTs</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Discover unique digital art from our collection. Each NFT is carefully crafted and available for instant purchase.
            </p>
          </div>
          
          {/* NFT Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 animate-pulse">
                  <div className="h-80 bg-gray-700"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded mb-4"></div>
                    <div className="h-10 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              // Error state
              <div className="col-span-full text-center py-12">
                <div className="text-red-400 mb-4">⚠️ {error}</div>
                <div className="text-gray-400">Using demo data instead</div>
              </div>
            ) : null}
            
            {!loading && displayNFTs.map((nft) => (
              <div key={nft.id} className="bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-700 group cursor-pointer">
                <div className="relative overflow-hidden">
                  <div className="relative h-80 bg-gray-700">
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  </div>
                  
                  {/* Status badges */}
                  <div className="absolute top-4 left-4">
                    {isApiNFT(nft) && nft.is_sold ? (
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-white rounded-full shadow-lg bg-red-500">
                        Sold
                      </span>
                    ) : isApiNFT(nft) && nft.is_reserved ? (
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-white rounded-full shadow-lg bg-yellow-500">
                        Reserved
                      </span>
                    ) : (
                      <span className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full shadow-lg ${
                        nft.rarity === 'Legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        nft.rarity === 'Epic' ? 'bg-gradient-to-r from-purple-400 to-pink-500' :
                        nft.rarity === 'Rare' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                        'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}>
                        {nft.rarity || 'Available'}
                      </span>
                    )}
                  </div>
                  
                  {/* No wallet needed badge */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      No wallet needed
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors line-clamp-1">
                    {nft.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {nft.description || 'Unique digital collectible available for purchase'}
                  </p>
                  
                  {/* Collection and Price */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500 font-medium">{nft.collection}</span>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">
                        {isApiNFT(nft) ? (
                          <>PayPal ${nft.price_usd} • UPI ₹{nft.price_inr}</>
                        ) : (
                          'PayPal • UPI'
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Buy button */}
                  <Link
                    href={`/collection/${nft.chainId}/${nft.contractAddress}/token/${nft.tokenId}`}
                    className={`block w-full text-center px-4 py-3 text-sm font-medium rounded-lg transition-all shadow-md hover:shadow-lg group-hover:shadow-purple-500/25 ${
                      (isApiNFT(nft) && (nft.is_sold || nft.is_reserved)) 
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                    }`}
                    {...((isApiNFT(nft) && (nft.is_sold || nft.is_reserved)) && { 
                      onClick: (e) => e.preventDefault() 
                    })}
                  >
                    {isApiNFT(nft) && nft.is_sold ? 'Sold Out' :
                     isApiNFT(nft) && nft.is_reserved ? 'Reserved' :
                     'Buy Now - Instant Delivery'}
                    {!(isApiNFT(nft) && (nft.is_sold || nft.is_reserved)) && (
                      <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Artists Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Featured Artists</h2>
            <p className="text-gray-400">Meet the talented creators behind our collection</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
                🎨
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">DigitalArt Studios</h3>
              <p className="text-gray-400 text-sm">Specializing in mythical and fantasy creatures</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
                🌌
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Stellar Visions</h3>
              <p className="text-gray-400 text-sm">Creating cosmic and space-themed artwork</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
                🦋
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">NatureSpirit Arts</h3>
              <p className="text-gray-400 text-sm">Capturing the beauty of natural transformations</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-800 rounded-xl p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">10+</div>
              <div className="text-gray-400">Unique NFTs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">₹49</div>
              <div className="text-gray-400">Fixed Price</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">2</div>
              <div className="text-gray-400">Payment Methods</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">0</div>
              <div className="text-gray-400">Wallet Required</div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-white mb-2">Browse NFTs</h3>
              <p className="text-gray-400">Explore our curated collection of unique digital artworks</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold text-white mb-2">Easy Payment</h3>
              <p className="text-gray-400">Pay with PayPal (USD) or   (INR) - no crypto wallet needed</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-2">Instant Delivery</h3>
              <p className="text-gray-400">Get your NFT immediately after payment confirmation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
