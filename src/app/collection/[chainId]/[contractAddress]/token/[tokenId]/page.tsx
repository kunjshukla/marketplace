import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

// Dynamically import the Token component as client-only (default export)
const Token = dynamic(() => import('@/components/token-page/TokenPage'), {
  ssr: false,
  loading: () => <div className="text-center p-8">Loading NFT...</div>,
});

export default function ListingPage({
  params,
}: {
  params: { tokenId: string };
}) {
  const { tokenId } = params;
  if (!tokenId) notFound();

  // Pass only the tokenId; Token will fetch its own data client-side
  return <Token tokenId={BigInt(tokenId)} />;
}