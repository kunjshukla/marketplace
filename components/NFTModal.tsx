import React from 'react';
import Image from 'next/image';
import { NFT } from '../types/nft';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface NFTModalProps {
  nft: NFT | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NFTModal({ nft, isOpen, onClose }: NFTModalProps) {
  if (!isOpen || !nft) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2">
            <div className="relative aspect-square">
              <Image
                src={nft.image}
                alt={nft.name}
                fill
                className="object-cover rounded-l-lg"
              />
            </div>
          </div>
          <div className="md:w-1/2 p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {nft.name}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {nft.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Collection</span>
                <p className="font-medium text-gray-900 dark:text-white">{nft.collection}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Artist</span>
                <p className="font-medium text-gray-900 dark:text-white">{nft.artist}</p>
              </div>
            </div>

            {nft.rarity && (
              <div className="mb-4">
                <Badge>{nft.rarity}</Badge>
              </div>
            )}

            {nft.attributes && nft.attributes.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Attributes
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {nft.attributes.map((attr, index) => (
                    <div key={index} className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {attr.trait_type}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {attr.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nft.price && (
              <div className="mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {nft.price} ETH
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1">
                {nft.price ? 'Buy Now' : 'Not for Sale'}
              </Button>
              <Button variant="outline">
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
