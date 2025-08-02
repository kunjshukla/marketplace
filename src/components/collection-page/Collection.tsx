import { MediaRenderer, useReadContract } from "thirdweb/react";
import { getNFT as getNFT721 } from "thirdweb/extensions/erc721";
import { getNFT as getNFT1155 } from "thirdweb/extensions/erc1155";
import { client } from "@/consts/client";
import { useState } from "react";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { ListingGrid } from "./ListingGrid";
import { AllNftsGrid } from "./AllNftsGrid";

export function Collection() {
  // `0` is Listings, `1` is `Auctions`
  const [tabIndex, setTabIndex] = useState<number>(0);
  const {
    type,
    nftContract,
    isLoading,
    contractMetadata,
    listingsInSelectedCollection,
    supplyInfo,
  } = useMarketplaceContext();

  // In case the collection doesn't have a thumbnail, we use the image of the first NFT
  const { data: firstNFT, isLoading: isLoadingFirstNFT } = useReadContract(
    type === "ERC1155" ? getNFT1155 : getNFT721,
    {
      contract: nftContract,
      tokenId: 0n,
      queryOptions: {
        enabled: isLoading || !!contractMetadata?.image,
      },
    }
  );

  const thumbnailImage =
    contractMetadata?.image || firstNFT?.metadata.image || "";
  return (
    <div className="mt-6">
      <div className="flex flex-col gap-4">
        <MediaRenderer
          client={client}
          src={thumbnailImage}
          style={{
            marginLeft: "auto",
            marginRight: "auto",
            borderRadius: "20px",
            width: "200px",
            height: "200px",
          }}
        />
        <h1 className="mx-auto text-3xl font-bold text-gray-900">
          {contractMetadata?.name || "Unknown collection"}
        </h1>
        {contractMetadata?.description && (
          <p className="max-w-lg lg:max-w-xl mx-auto text-center text-gray-600">
            {contractMetadata.description}
          </p>
        )}

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
