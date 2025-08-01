import type { Chain } from "thirdweb";
import { avalancheFuji, polygonAmoy } from "./chains";

export type NftContract = {
  address: string;
  chain: Chain;
  type: "ERC1155" | "ERC721";

  title?: string;
  description?: string;
  thumbnailUrl?: string;
  slug?: string;
  source?: string;
};

/**
 * Below is a list of all NFT contracts supported by your marketplace(s)
 * This is of course hard-coded for demo purpose
 *
 * In reality, the list should be dynamically fetched from your own data source
 */
export const NFT_CONTRACTS: NftContract[] = [
  {
    address: "0x6b869a0cF84147f05a447636c42b8E53De65714E",
    chain: avalancheFuji,
    title: "Sanatani NFT",
    thumbnailUrl: "/assets/sanatani-cover.png",
    type: "ERC721",
  },
  {
    address: "0xC5A2c72c581eA4A17e17bEeF38a9597132830401",
    chain: avalancheFuji,
    title: "Ugly Waifu",
    thumbnailUrl:
      "https://258c828e8cc853bf5e0efd001055fb39.ipfscdn.io/ipfs/bafybeidaadqapi7twzd7pjp24tu4ngsr3teubrhop7hg3jk3oj6lqysfgm/OS-LOGO.png",
    slug: "ugly-waifu",
    type: "ERC721",
  },

  {
    address: "0x0896Db00D8987Fba2152aa7c14c4255eBC7354cE",
    chain: avalancheFuji,
    title: "Unnamed Collection",
    description: "",
    thumbnailUrl:
      "https://258c828e8cc853bf5e0efd001055fb39.ipfscdn.io/ipfs/Qmct2vS78Uwug3zVtqQognskPPRmd4wRQiaDAQWt1kRJws/0.png",
    slug: "unnamed-collection",
    type: "ERC721",
  },
  {
    address: "0x0ACaCa3d3F64bb6e6D3564BBc891c58Bd4A4c83c",
    chain: avalancheFuji,
    title: "GoroBot",
    thumbnailUrl:
      "https://258c828e8cc853bf5e0efd001055fb39.ipfscdn.io/ipfs/bafybeiay3ffxy3os56bvnu5cmq7gids4v6n4hf5nvvcb3gy2dzavi3ltnu/profile.jpg",
    slug: "gorobot",
    type: "ERC721",
  },
  {
    address: "0x4b6CDEFF5885A57678261bb95250aC43aD490752",
    chain: polygonAmoy,
    title: "Mata NFT",
    thumbnailUrl:
      "https://258c828e8cc853bf5e0efd001055fb39.ipfscdn.io/ipfs/bafybeidec7x6bptqmrxgptaedd7wfwxbsccqfogzwfsd4a7duxn4sdmnxy/0.png",
    type: "ERC721",
  },
  {
    address: "0xd5e815241882676F772A624E3892b27Ff3a449c4",
    chain: avalancheFuji,
    title: "Cats (ERC1155)",
    thumbnailUrl:
      "https://258c828e8cc853bf5e0efd001055fb39.ipfscdn.io/ipfs/bafybeif2nz6wbwuryijk2c4ayypocibexdeirlvmciqjyvlzz46mzoirtm/0.png",
    type: "ERC1155",
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    chain: avalancheFuji,
    title: "NFT #1",
    thumbnailUrl: "/assets/Nfts/1.png",
    type: "ERC721",
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    chain: avalancheFuji,
    title: "NFT #2",
    thumbnailUrl: "/assets/Nfts/2.png",
    type: "ERC721",
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    chain: avalancheFuji,
    title: "NFT #3",
    thumbnailUrl: "/assets/Nfts/3.png",
    type: "ERC721",
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    chain: avalancheFuji,
    title: "NFT #4",
    thumbnailUrl: "/assets/Nfts/4.png",
    type: "ERC721",
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    chain: avalancheFuji,
    title: "NFT #5",
    thumbnailUrl: "/assets/Nfts/5.png",
    type: "ERC721",
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    chain: avalancheFuji,
    title: "NFT #6",
    thumbnailUrl: "/assets/Nfts/6.png",
    type: "ERC721",
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    chain: avalancheFuji,
    title: "NFT #7",
    thumbnailUrl: "/assets/Nfts/7.png",
    type: "ERC721",
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    chain: avalancheFuji,
    title: "NFT #8",
    thumbnailUrl: "/assets/Nfts/8.png",
    type: "ERC721",
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    chain: avalancheFuji,
    title: "NFT #9",
    thumbnailUrl: "/assets/Nfts/9.png",
    type: "ERC721",
  },
  {
    address: "0x0000000000000000000000000000000000000000",
    chain: avalancheFuji,
    title: "NFT #10",
    thumbnailUrl: "/assets/Nfts/10.png",
    type: "ERC721",
  },
];
