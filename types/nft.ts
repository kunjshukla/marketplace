export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  artist: string;
  category: string;
  tokenId?: string;
  price?: number;
  attributes?: NFTAttribute[];
  rarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  tags?: string[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  image: string;
  nftCount: number;
}
