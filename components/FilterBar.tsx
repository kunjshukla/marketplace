import React from 'react';
import { Button } from './ui/Button';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCollection: string;
  onCollectionChange: (collection: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedRarity: string;
  onRarityChange: (rarity: string) => void;
  collections: string[];
  categories: string[];
  rarities: string[];
  onClearFilters: () => void;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  selectedCollection,
  onCollectionChange,
  selectedCategory,
  onCategoryChange,
  selectedRarity,
  onRarityChange,
  collections,
  categories,
  rarities,
  onClearFilters,
}: FilterBarProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search NFTs..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCollection}
              onChange={(e) => onCollectionChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Collections</option>
              {collections.map((collection) => (
                <option key={collection} value={collection}>
                  {collection}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={selectedRarity}
              onChange={(e) => onRarityChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Rarities</option>
              {rarities.map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity}
                </option>
              ))}
            </select>
            <Button onClick={onClearFilters} variant="outline">
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
