'use client';

import { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FilterBar } from '../components/FilterBar';
import { NFTGrid } from '../components/NFTGrid';
import { NFTModal } from '../components/NFTModal';
import { nfts } from '../data/nfts';
import { NFT } from '../types/nft';

export default function HomePage() {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');

  // Extract unique values for filters
  const uniqueCollections = Array.from(new Set(nfts.map(nft => nft.collection)));
  const uniqueCategories = Array.from(new Set(nfts.map(nft => nft.category)));
  const uniqueRarities = Array.from(new Set(nfts.map(nft => nft.rarity).filter(Boolean))) as string[];

  // Filter NFTs based on current filters
  const filteredNFTs = useMemo(() => {
    return nfts.filter(nft => {
      const matchesSearch = searchTerm === '' || 
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.artist.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCollection = selectedCollection === '' || nft.collection === selectedCollection;
      const matchesCategory = selectedCategory === '' || nft.category === selectedCategory;
      const matchesRarity = selectedRarity === '' || nft.rarity === selectedRarity;

      return matchesSearch && matchesCollection && matchesCategory && matchesRarity;
    });
  }, [searchTerm, selectedCollection, selectedCategory, selectedRarity]);

  const handleViewNFT = (nft: NFT) => {
    setSelectedNFT(nft);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCollection('');
    setSelectedCategory('');
    setSelectedRarity('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Discover Amazing NFTs
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Explore our curated collection of exceptional digital artworks from talented artists around the world
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCollection={selectedCollection}
        onCollectionChange={setSelectedCollection}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedRarity={selectedRarity}
        onRarityChange={setSelectedRarity}
        collections={uniqueCollections}
        categories={uniqueCategories}
        rarities={uniqueRarities}
        onClearFilters={clearFilters}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {filteredNFTs.length === nfts.length ? 'All NFTs' : 'Search Results'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredNFTs.length} {filteredNFTs.length === 1 ? 'item' : 'items'} found
          </p>
        </div>

        <NFTGrid nfts={filteredNFTs} onViewNFT={handleViewNFT} />
      </main>

      {/* NFT Modal */}
      <NFTModal
        nft={selectedNFT}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNFT(null);
        }}
      />

      <Footer />
    </div>
  );
}