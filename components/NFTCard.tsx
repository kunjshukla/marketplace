import React from 'react';
import Image from 'next/image';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { NFT } from '../types/nft';

interface NFTCardProps {
  nft: NFT;
  onView: (nft: NFT) => void;
}

export function NFTCard({ nft, onView }: NFTCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105">
      <div className="relative aspect-square">
        <Image
          src={nft.image}
          alt={nft.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {nft.name}
          </h3>
          {nft.tokenId && <Badge variant="secondary">#{nft.tokenId}</Badge>}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {nft.description}
        </p>
        <div className="mb-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">Collection</span>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {nft.collection}
          </p>
        </div>
        {nft.price && (
          <div className="mb-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Price</span>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {nft.price} ETH
            </p>
          </div>
        )}
        <Button 
          onClick={() => onView(nft)}
          className="w-full"
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
