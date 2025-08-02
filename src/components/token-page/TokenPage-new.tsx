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

const CancelListingButton = dynamic(() => import("./CancelListingButton"), {
  ssr: false,
});
const BuyFromListingButton = dynamic(() => import("./BuyFromListingButton"), {
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

  if (!allLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">NFT not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="mt-6 mx-auto max-w-7xl px-4">
        <div className="flex flex-col lg:flex-row justify-center gap-8">
          {/* NFT Image */}
          <div className="flex-shrink-0">
            <div className="w-full max-w-md lg:max-w-lg">
              <MediaRenderer
                client={client}
                src={nft?.metadata?.image}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "12px",
                }}
              />
            </div>
          </div>

          {/* NFT Details */}
          <div className="flex-1 max-w-md lg:max-w-lg space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {nft?.metadata?.name || `#${tokenId.toString()}`}
              </h1>
              <p className="text-gray-600">
                {nft?.metadata?.description || "No description available"}
              </p>
            </div>

            {/* Owner Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Owner</p>
              <p className="font-medium">
                {nft?.owner ? shortenAddress(nft.owner) : "Unknown"}
                {ownedByYou && <span className="text-green-600 ml-2">(You)</span>}
              </p>
            </div>

            {/* Listings */}
            {listings.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Available for Purchase</h3>
                {listings.map((item) => (
                  <div key={item.id.toString()} className="flex justify-between items-center mb-2">
                    <span className="text-blue-800">
                      {item.currencyValuePerToken.displayValue} {item.currencyValuePerToken.symbol}
                    </span>
                    {account && !ownedByYou && (
                      <BuyFromListingButton listing={item} account={account} />
                    )}
                    {ownedByYou && account && (
                      <CancelListingButton account={account} listingId={item.id} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Create Listing */}
            {ownedByYou && listings.length === 0 && account && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">Create Listing</h3>
                <CreateListing tokenId={tokenId} account={account} />
              </div>
            )}

            {/* NFT Attributes */}
            {nft?.metadata?.attributes && (
              <NftAttributes attributes={nft.metadata.attributes} />
            )}

            {/* NFT Details */}
            <NftDetails nft={nft} />

            {/* Related Listings */}
            {listings.length > 0 && (
              <RelatedListings excludedListingId={listings[0].id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
