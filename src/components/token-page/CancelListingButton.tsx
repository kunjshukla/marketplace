import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { useState } from "react";
import { sendAndConfirmTransaction } from "thirdweb";
import { cancelListing } from "thirdweb/extensions/marketplace";
import {
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import type { Account } from "thirdweb/wallets";

type Props = {
  account: Account;
  listingId: bigint;
};

export default function CancelListingButton(props: Props) {
  const { marketplaceContract, refetchAllListings, nftContract } =
    useMarketplaceContext();
  const switchChain = useSwitchActiveWalletChain();
  const activeChain = useActiveWalletChain();
  const { account, listingId } = props;
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      disabled={isLoading}
      onClick={async () => {
        if (activeChain?.id !== nftContract.chain.id) {
          await switchChain(nftContract.chain);
        }
        setIsLoading(true);
        try {
          const transaction = cancelListing({
            contract: marketplaceContract,
            listingId,
          });
          await sendAndConfirmTransaction({
            transaction,
            account,
          });
          alert("Listing cancelled successfully");
          refetchAllListings();
        } catch (error) {
          console.error("Error cancelling listing:", error);
          alert("Failed to cancel listing. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {isLoading ? "Cancelling..." : "Cancel"}
    </button>
  );
}
