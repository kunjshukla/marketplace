import React from 'react';
import { NFTCard } from './NFTCard';
import { NFT } from '../types/nft';

interface NFTGridProps {
  nfts: NFT[];
  onViewNFT: (nft: NFT) => void;
}

export function NFTGrid({ nfts, onViewNFT }: NFTGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {nfts.map((nft) => (
        <NFTCard
          key={nft.id}
          nft={nft}
          onView={onViewNFT}
        />
      ))}
    </div>
  );
}
