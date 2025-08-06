import '../src/app/globals.css';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize any global settings here
    console.log('NFT Marketplace initialized');
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
