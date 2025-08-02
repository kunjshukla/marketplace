import { NFT_CONTRACTS, type NftContract } from "@/consts/nft_contracts";
import { useState, type Dispatch, SetStateAction } from "react";

type Props = {
  selectedCollection: NftContract;
  setSelectedCollection: Dispatch<SetStateAction<NftContract>>;
};

export function ProfileMenu(props: Props) {
  const { selectedCollection, setSelectedCollection } = props;
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="w-full lg:w-80">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
        >
          <span className="text-left font-medium text-gray-900">Collections</span>
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
            <div className="space-y-2">
              {NFT_CONTRACTS.map((item) => (
                <button
                  key={item.address}
                  onClick={() => setSelectedCollection(item)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    item.address === selectedCollection.address
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-white hover:bg-gray-50 border border-gray-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={item.thumbnailUrl ?? ""}
                    alt={item.title}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {item.title ?? "Unknown collection"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
