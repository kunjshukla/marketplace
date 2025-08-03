import { client } from "@/consts/client";
import { FaExternalLinkAlt } from "react-icons/fa";
import { balanceOf, getNFT as getERC1155 } from "thirdweb/extensions/erc1155";
import { getNFT as getERC721 } from "thirdweb/extensions/erc721";
import {
  MediaRenderer,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";
import { NftAttributes } from "./NftAttributes";
import { CreateListing } from "./CreateListing";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import dynamic from "next/dynamic";
import { NftDetails } from "./NftDetails";
import RelatedListings from "./RelatedListings";
import { useState, useEffect } from "react";
import PaymentFlow from "../payment/PaymentFlow";
import { nfts } from "@/data/nfts";
import { NFT_CONTRACTS } from "@/consts/nft_contracts";
import type { NFT as ThirdwebNFT } from "thirdweb";
import Image from "next/image";

const CancelListingButton = dynamic(() => import("./CancelListingButton"), {
  ssr: false,
});

type Props = {
  tokenId: bigint;
};

export function Token(props: Props) {
  const {
    type,
    nftContract,
    allAuctions,
    isLoading,
    contractMetadata,
    isRefetchingAllListings,
    listingsInSelectedCollection,
  } = useMarketplaceContext();
  const { tokenId } = props;
  const account = useActiveAccount();
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  // Find local NFT data that matches current contract and token
  const localNftData = nfts.find(nft => 
    nft.chainId === nftContract.chain.id.toString() &&
    nft.contractAddress && nft.contractAddress.toLowerCase() === nftContract.address.toLowerCase() &&
    nft.tokenId === tokenId.toString()
  );

  // Find contract data from NFT_CONTRACTS
  const contractData = NFT_CONTRACTS.find(contract => 
    contract.address.toLowerCase() === nftContract.address.toLowerCase() &&
    contract.chain.id === nftContract.chain.id
  );

  const { data: nft, isLoading: isLoadingNFT } = useReadContract(
    type === "ERC1155" ? getERC1155 : getERC721,
    {
      tokenId: BigInt(tokenId),
      contract: nftContract,
      includeOwner: true,
    }
  );

  const { data: ownedQuantity1155 } = useReadContract(balanceOf, {
    contract: nftContract,
    owner: account?.address!,
    tokenId: tokenId,
    queryOptions: {
      enabled: !!account?.address && type === "ERC1155",
    },
  });

  const listings = (listingsInSelectedCollection || []).filter(
    (item) =>
      item.assetContractAddress.toLowerCase() ===
        nftContract.address.toLowerCase() && item.asset.id === BigInt(tokenId)
  );

  const auctions = (allAuctions || []).filter(
    (item) =>
      item.assetContractAddress.toLowerCase() ===
        nftContract.address.toLowerCase() && item.asset.id === BigInt(tokenId)
  );

  const allLoaded = !isLoadingNFT && !isLoading && !isRefetchingAllListings;
  const ownedByYou = nft?.owner?.toLowerCase() === account?.address?.toLowerCase();

  console.log('Token Page Debug:', {
    tokenId: tokenId.toString(),
    contractAddress: nftContract.address,
    chainId: nftContract.chain.id,
    localNftData,
    contractData,
    nft: nft?.metadata
  });

  if (!allLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="text-2xl font-bold text-white mt-8">Loading NFT...</h2>
        </div>
      </div>
    );
  }

  // Use local data if available, otherwise fallback to on-chain data or create fallback
  const displayData = {
    name: localNftData?.name || nft?.metadata?.name || `${contractData?.title || "NFT"} #${tokenId}`,
    description: localNftData?.description || nft?.metadata?.description || "No description available",
    image: localNftData?.image || nft?.metadata?.image || contractData?.thumbnailUrl || "/nft-placeholder.png",
    attributes: (localNftData?.attributes || nft?.metadata?.attributes || []) as Array<{ trait_type: string; value: any }>,
  };

  // Create a fallback NFT object that matches thirdweb's NFT type
  const fallbackNft: ThirdwebNFT = {
    metadata: {
      uri: "",
      name: displayData.name,
      description: displayData.description,
      image: displayData.image,
      attributes: displayData.attributes
    },
    owner: account?.address || "0x0",
    id: tokenId,
    type: "ERC721" as const,
    tokenURI: "",
    tokenAddress: nftContract.address,
    chainId: nftContract.chain.id
  };

  // Fixed pricing for demo - in production this would come from contract/API
  const fixedPriceUSD = 99;
  const fixedPriceINR = 8200;

  if (showPaymentFlow) {
    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <PaymentFlow
            nftId={tokenId.toString()}
            priceUSD={fixedPriceUSD}
            priceINR={fixedPriceINR}
            onClose={() => setShowPaymentFlow(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NFT Image */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-6">
              <MediaRenderer
                client={client}
                src={displayData.image}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "12px",
                }}
              />
            </div>

            {/* Collection Info */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Collection</p>
                  <p className="font-semibold text-white">
                    {contractData?.title || contractMetadata?.name || "Unknown Collection"}
                  </p>
                </div>
                <a
                  href={`/collection/${nftContract.chain.id}/${nftContract.address}`}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <FaExternalLinkAlt className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* NFT Attributes */}
            {displayData.attributes && Array.isArray(displayData.attributes) && displayData.attributes.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6">
                <NftAttributes attributes={displayData.attributes as Record<string, unknown>[]} />
              </div>
            )}

            {/* NFT Details */}
            <div className="bg-gray-800 rounded-xl p-6">
              <NftDetails nft={nft || fallbackNft} />
            </div>

            {/* Related Listings */}
            {listings.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6">
                <RelatedListings excludedListingId={listings[0].id} />
              </div>
            )}
          </div>

          {/* NFT Info and Actions */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                {displayData.name}
              </h1>
              <p className="text-gray-400 text-lg mb-4">
                {displayData.description}
              </p>
              
              {/* Fixed Price Display */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Fixed Price</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      ${fixedPriceUSD} / ₹{fixedPriceINR.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">PayPal • Razorpay</div>
                  </div>
                </div>
              </div>

              {/* Buy Button */}
              <button
                onClick={() => setShowPaymentFlow(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Buy Now - No Wallet Needed
              </button>
              
              <p className="text-sm text-gray-400 text-center mt-2">
                Pay with PayPal (USD) or Razorpay (INR)
              </p>
            </div>

            {/* Owner Info */}
            {nft?.owner && (
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Owned by</p>
                    <p className="font-semibold text-white">
                      {ownedByYou ? "You" : shortenAddress(nft.owner)}
                    </p>
                  </div>
                  {type === "ERC1155" && ownedQuantity1155 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-400 mb-1">Quantity</p>
                      <p className="font-semibold text-white">
                        {ownedQuantity1155.toString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Listing Actions for Owner */}
            {ownedByYou && account && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Listing Actions
                </h3>
                
                {listings.length > 0 ? (
                  <div className="space-y-3">
                    {listings.map((listing) => (
                      <div
                        key={listing.id}
                        className="bg-gray-700 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-semibold">
                              Listed for {listing.currencyValuePerToken.displayValue}{" "}
                              {listing.currencyValuePerToken.symbol}
                            </p>
                            <p className="text-sm text-gray-400">
                              Expires:{" "}
                              {new Date(
                                Number(listing.endTimeInSeconds) * 1000
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <CancelListingButton 
                            listingId={listing.id} 
                            account={account}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <CreateListing 
                    tokenId={tokenId} 
                    account={account}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Make sure to export the component as default as well
export default Token;
