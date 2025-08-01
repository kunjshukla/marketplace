import { client } from "@/consts/client";
import {
  Box,
  Flex,
  Heading,
  Link,
  Text,
} from "@chakra-ui/react";
import { Accordion, AccordionItem, AccordionIcon, AccordionButton } from "@chakra-ui/accordion";
import {
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
} from '@chakra-ui/table';
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

  const ownedByYou =
    nft?.owner?.toLowerCase() === account?.address?.toLowerCase();

  return (
    <Flex direction="column">
      <Box mt="24px" mx="auto">
        <Flex
          direction={{ lg: "row", base: "column" }}
          justifyContent={{ lg: "center", base: "space-between" }}
          gap={{ lg: 20, base: 5 }}
        >
          <Flex direction="column" w={{ lg: "45vw", base: "90vw" }} gap="5">
            <MediaRenderer
              client={client}
              src={nft?.metadata?.image}
              style={{ width: "max-content", height: "auto", aspectRatio: "1" }}
            />
            <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
              <AccordionItem value="description">
                <AccordionButton>
                  <Box as="button" display="flex" alignItems="center" width="100%">
                    <Box as="span" flex="1" textAlign="left">
                      Description
                    </Box>
                    <AccordionIcon />
                  </Box>
                </AccordionButton>
                <Box pb={4}>
                  <Text>{nft?.metadata?.description}</Text>
                </Box>
                {nft?.metadata?.attributes &&
                  (Array.isArray(nft.metadata.attributes)
                    ? nft.metadata.attributes.length > 0
                    : Object.keys(nft.metadata.attributes).length > 0) && (
                    <NftAttributes attributes={nft.metadata.attributes} />
                  )}
                {nft && <NftDetails nft={nft} />}
              </AccordionItem>
            </Accordion>
          </Flex>
          <Box w={{ lg: "45vw", base: "90vw" }}>
            <Text>Collection</Text>
            <Flex direction="row" gap="3">
              <Heading>{contractMetadata?.name}</Heading>
              <Link
                color="gray"
                href={`/collection/${nftContract.chain.id}/${nftContract.address}`}
              >
                <FaExternalLinkAlt size={20} />
              </Link>
            </Flex>
            <br />
            <Text># {nft?.id?.toString()}</Text>
            <Heading>{nft?.metadata?.name}</Heading>
            <br />
            {type === "ERC1155" ? (
              <>
                {account && ownedQuantity1155 && (
                  <>
                    <Text>You own</Text>
                    <Heading>{ownedQuantity1155.toString()}</Heading>
                  </>
                )}
              </>
            ) : (
              <>
                <Text>Current owner</Text>
                <Flex direction="row">
                  <Heading>
                    {nft?.owner ? shortenAddress(nft.owner) : "N/A"}{" "}
                  </Heading>
                  {ownedByYou && <Text color="gray">(You)</Text>}
                </Flex>
              </>
            )}
            {account &&
              nft &&
              (ownedByYou || (ownedQuantity1155 && ownedQuantity1155 > 0n)) && (
                <CreateListing tokenId={nft?.id} account={account} />
              )}
            <Accordion
              mt="30px"
              sx={{ container: {} }}
              defaultIndex={[0, 1]}
              allowMultiple
            >
              <AccordionItem value="listings">
                <AccordionButton>
                  <Box as="button" display="flex" alignItems="center" width="100%">
                    <Box as="span" flex="1" textAlign="left">
                      Listings ({listings.length})
                    </Box>
                    <AccordionIcon />
                  </Box>
                </AccordionButton>
                <Box pb={4}>
                  {listings.length > 0 ? (
                    <TableContainer>
                      <Table
                        variant="simple"
                        sx={{ "th, td": { borderBottom: "none" } }}
                      >
                        <Thead>
                          <Tr>
                            <Th>Price</Th>
                            {type === "ERC1155" && <Th px={1}>Qty</Th>}
                            <Th>Expiration</Th>
                            <Th px={1}>From</Th>
                            <Th>{""}</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {listings.map((item) => {
                            const listedByYou =
                              item.creatorAddress.toLowerCase() ===
                              account?.address?.toLowerCase();
                            return (
                              <Tr key={item.id.toString()}>
                                <Td>
                                  <Text>
                                    {item.currencyValuePerToken.displayValue}{" "}
                                    {item.currencyValuePerToken.symbol}
                                  </Text>
                                </Td>
                                {type === "ERC1155" && (
                                  <Td px={1}>
                                    <Text>{item.quantity.toString()}</Text>
                                  </Td>
                                )}
                                <Td>
                                  <Text>
                                    {getExpiration(item.endTimeInSeconds)}
                                  </Text>
                                </Td>
                                <Td px={1}>
                                  <Text>
                                    {item.creatorAddress.toLowerCase() ===
                                    account?.address?.toLowerCase()
                                      ? "You"
                                      : shortenAddress(item.creatorAddress)}
                                  </Text>
                                </Td>
                                {account && (
                                  <Td>
                                    {!listedByYou ? (
                                      <BuyFromListingButton
                                        account={account}
                                        listing={item}
                                      />
                                    ) : (
                                      <CancelListingButton
                                        account={account}
                                        listingId={item.id}
                                      />
                                    )}
                                  </Td>
                                )}
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Text>This item is not listed for sale</Text>
                  )}
                </Box>
                <RelatedListings excludedListingId={listings[0]?.id ?? -1n} />
              </AccordionItem>
            </Accordion>
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
}

function getExpiration(endTimeInSeconds: bigint) {
  const currentDate = new Date();
  const milliseconds: bigint = endTimeInSeconds * 1000n;
  const futureDate = new Date(currentDate.getTime() + Number(milliseconds));
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    timeZoneName: "short",
  };
  const formattedDate = futureDate.toLocaleDateString("en-US", options);
  return formattedDate;
}