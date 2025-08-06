"use client";

import { useState, useEffect } from 'react';

interface NFT {
  id: number;
  title: string;
  description: string;
  price_usd: number;
}

export default function DebugPage() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[]>([]);

  useEffect(() => {
    const fetchNFTs = async () => {
      const debugLog = [];
      debugLog.push('Starting NFT fetch...');
      
      try {
        setLoading(true);
        debugLog.push('Making API call to http://localhost:8000/api/nfts');
        
        const response = await fetch('http://localhost:8000/api/nfts?limit=3');
        
        debugLog.push(`Response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        debugLog.push(`Response data success: ${data?.success}`);
        debugLog.push(`NFT count: ${data?.data?.length || 0}`);
        
        if (data?.success && data?.data) {
          setNfts(data.data);
          debugLog.push('NFTs set successfully');
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        debugLog.push(`Error: ${errorMessage}`);
        setError(errorMessage);
      } finally {
        setLoading(false);
        setDebug(debugLog);
      }
    };

    fetchNFTs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">NFT Debug Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl mb-4">Debug Log:</h2>
        <div className="bg-gray-800 p-4 rounded">
          {debug.map((log, index) => (
            <div key={index} className="text-sm mb-1">{log}</div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-4">Status:</h2>
        <div className="bg-gray-800 p-4 rounded">
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>Error: {error || 'None'}</div>
          <div>NFT Count: {nfts.length}</div>
        </div>
      </div>

      <div>
        <h2 className="text-xl mb-4">NFTs:</h2>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-400">Error: {error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <div key={nft.id} className="bg-gray-800 p-4 rounded">
                <h3 className="font-bold">{nft.title}</h3>
                <p className="text-sm text-gray-400">{nft.description}</p>
                <p className="text-green-400">${nft.price_usd}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
