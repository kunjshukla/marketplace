import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import Link from "next/link";
import { useState } from "react";
import type { NFT } from "thirdweb";
import { shortenAddress } from "thirdweb/utils";

type Props = {
  nft: NFT;
};

export function NftDetails(props: Props) {
  const { type, nftContract } = useMarketplaceContext();
  const { nft } = props;
  const [isOpen, setIsOpen] = useState(false);
  
  const contractUrl = `${
    nftContract.chain.blockExplorers
      ? nftContract.chain.blockExplorers[0]?.url
      : ""
  }/address/${nftContract.address}`;
  const tokenUrl = `${
    nftContract.chain.blockExplorers
      ? nftContract.chain.blockExplorers[0]?.url
      : ""
  }/nft/${nftContract.address}/${nft.id.toString()}`;
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-left font-medium text-gray-900">Details</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Contract address</span>
              <a 
                href={contractUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 hover:underline"
              >
                {shortenAddress(nftContract.address)}
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Token ID</span>
              <a 
                href={tokenUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 hover:underline"
              >
                {nft?.id.toString()}
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Token Standard</span>
              <span className="text-gray-900">{type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chain</span>
              <span className="text-gray-900">{nftContract.chain.name ?? "Unnamed chain"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
