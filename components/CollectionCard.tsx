import React from 'react';
import Image from 'next/image';
import { Collection } from '../types/nft';
import { Button } from './ui/Button';

interface CollectionCardProps {
  collection: Collection;
  onView?: (collection: Collection) => void;
}

export function CollectionCard({ collection, onView }: CollectionCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105">
      <div className="relative h-48">
        <Image
          src={collection.image}
          alt={collection.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {collection.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {collection.nftCount} items
          </span>
          <Button onClick={() => onView?.(collection)} size="sm">
            Explore
          </Button>
        </div>
      </div>
    </div>
  );
}
