"use client";

import { nfts } from "@/data/nfts";
import Link from "next/link";
import { useState, useMemo } from "react";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");

  // Extract unique values for filters
  const uniqueCollections = Array.from(new Set(nfts.map(nft => nft.collection)));
  const uniqueCategories = Array.from(new Set(nfts.map(nft => nft.category)));
  const uniqueRarities = Array.from(new Set(nfts.map(nft => nft.rarity).filter(Boolean))) as string[];

  // Filter NFTs based on current filters
  const filteredNfts = useMemo(() => {
    return nfts.filter(nft => {
      const matchesSearch = searchTerm === '' || 
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCollection = selectedCollection === '' || nft.collection === selectedCollection;
      const matchesCategory = selectedCategory === '' || nft.category === selectedCategory;
      const matchesRarity = selectedRarity === '' || nft.rarity === selectedRarity;
      
      return matchesSearch && matchesCollection && matchesCategory && matchesRarity;
    });
  }, [searchTerm, selectedCollection, selectedCategory, selectedRarity]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCollection("");
    setSelectedCategory("");
    setSelectedRarity("");
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-6">
              Discover Amazing NFTs
            </h1>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto mb-8">
              Explore our curated collection of exceptional digital artworks from talented artists around the world
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filter Section */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                placeholder="Search NFTs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white placeholder-gray-400"
              />
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-w-[200px] bg-gray-700 text-white"
              >
                <option value="">All Collections</option>
                {uniqueCollections.map(collection => (
                  <option key={collection} value={collection}>{collection}</option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-w-[200px] bg-gray-700 text-white"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-w-[200px] bg-gray-700 text-white"
              >
                <option value="">All Rarities</option>
                {uniqueRarities.map(rarity => (
                  <option key={rarity} value={rarity}>{rarity}</option>
                ))}
              </select>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">All NFTs</h2>
              <div className="text-sm text-gray-400">
                {filteredNfts.length} items found
              </div>
            </div>
          </div>
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredNfts.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NFTCard({ nft }: { nft: any }) {
  // Build the proper route using chainId, contractAddress, and tokenId
  const href = nft.chainId && nft.contractAddress && nft.tokenId 
    ? `/collection/${nft.chainId}/${nft.contractAddress}/token/${nft.tokenId}`
    : `/collection/43113/0x6b869a0cF84147f05a447636c42b8E53De65714E/token/${nft.id}`;

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-700 group cursor-pointer">
      <div className="relative overflow-hidden">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-4 left-4">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full shadow-lg">
            {nft.rarity}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
          {nft.name}
        </h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {nft.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 font-medium">{nft.collection}</span>
          <Link
            href={href}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
          >
            View Details
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
