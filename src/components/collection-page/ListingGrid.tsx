import { client } from "@/consts/client";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import Link from "next/link";
import { MediaRenderer } from "thirdweb/react";

export function ListingGrid() {
  const { listingsInSelectedCollection, nftContract } = useMarketplaceContext();
  const len = listingsInSelectedCollection.length;
  
  if (!listingsInSelectedCollection || !len) return <></>;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 mx-auto mt-5">
      {listingsInSelectedCollection.map((item) => (
        <Link
          key={item.id}
          href={`/collection/${nftContract.chain.id}/${nftContract.address}/token/${item.asset.id.toString()}`}
          className="block hover:no-underline"
        >
          <div className="rounded-xl bg-white shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100">
            <div className="flex flex-col">
              <div className="relative group">
                <MediaRenderer 
                  client={client} 
                  src={item.asset.metadata.image}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover"
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.asset?.metadata?.name ?? "Unknown item"}
                </h3>
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <p className="text-lg font-bold text-blue-600">
                  {item.currencyValuePerToken.displayValue}{" "}
                  {item.currencyValuePerToken.symbol}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
