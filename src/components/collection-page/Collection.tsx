import { MediaRenderer, useReadContract } from "thirdweb/react";
import { getNFT as getNFT721 } from "thirdweb/extensions/erc721";
import { getNFT as getNFT1155 } from "thirdweb/extensions/erc1155";
import { client } from "@/consts/client";
import { useState } from "react";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { ListingGrid } from "./ListingGrid";
import { AllNftsGrid } from "./AllNftsGrid";
import { NFT_CONTRACTS } from "@/consts/nft_contracts";
import { useParams } from "next/navigation";

export function Collection() {
  // `0` is Listings, `1` is `Auctions`
  const [tabIndex, setTabIndex] = useState<number>(0);
  const params = useParams();
  const {
    type,
    nftContract,
    isLoading,
    contractMetadata,
    listingsInSelectedCollection,
    supplyInfo,
  } = useMarketplaceContext();

  // Get curated collection data from NFT_CONTRACTS
  const chainId = Number.parseInt(params.chainId as string);
  const contractAddress = params.contractAddress as string;
  
  const curatedCollection = NFT_CONTRACTS.find(
    (item) =>
      item.address.toLowerCase() === contractAddress.toLowerCase() &&
      item.chain.id === chainId
  );

  // In case the collection doesn't have a thumbnail, we use the image of the first NFT
  const { data: firstNFT, isLoading: isLoadingFirstNFT } = useReadContract(
    type === "ERC1155" ? getNFT1155 : getNFT721,
    {
      contract: nftContract,
      tokenId: 0n,
      queryOptions: {
        enabled: !isLoading && !curatedCollection?.thumbnailUrl && !contractMetadata?.image,
      },
    }
  );

  // Debug logging
  console.log('Collection Debug:', {
    chainId,
    contractAddress,
    curatedCollection,
    contractMetadata,
    hasFirstNFT: !!firstNFT
  });

  // Prefer curated data, fallback to contract metadata, then first NFT
  const collectionImage = 
    curatedCollection?.thumbnailUrl || 
    contractMetadata?.image || 
    firstNFT?.metadata.image || 
    "/assets/nfts/1.png"; // Use existing NFT as placeholder
  
  const collectionName = 
    curatedCollection?.title || 
    contractMetadata?.name || 
    "Unknown Collection";
  
  const collectionDescription = 
    curatedCollection?.description || 
    contractMetadata?.description || 
    "No description available for this collection.";
  return (
    <div className="mt-6">
      <div className="flex flex-col gap-4">
        <MediaRenderer
          client={client}
          src={collectionImage}
          style={{
            marginLeft: "auto",
            marginRight: "auto",
            borderRadius: "20px",
            width: "200px",
            height: "200px",
          }}
        />
        <h1 className="mx-auto text-3xl font-bold text-gray-900">
          {collectionName}
        </h1>
        <p className="max-w-lg lg:max-w-xl mx-auto text-center text-gray-600">
          {collectionDescription}
        </p>

        <div className="mx-auto mt-5">
          <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setTabIndex(0)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tabIndex === 0
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Listings ({listingsInSelectedCollection.length || 0})
            </button>
            <button
              onClick={() => setTabIndex(1)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tabIndex === 1
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All items{" "}
              {supplyInfo
                ? `(${(
                    supplyInfo.endTokenId -
                    supplyInfo.startTokenId +
                    1n
                  ).toString()})`
                : ""}
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        {tabIndex === 0 && <ListingGrid />}
        {tabIndex === 1 && <AllNftsGrid />}
      </div>
    </div>
  );
}
