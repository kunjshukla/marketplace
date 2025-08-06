import { useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthCallback = () => {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { token, error } = router.query;

        if (error) {
          console.error('Auth error:', error);
          alert('Authentication failed. Please try again.');
          router.push('/');
          return;
        }

        if (token) {
          // Store JWT token
          localStorage.setItem('jwt_token', token);
          
          // Fetch user data
          const response = await fetch('http://localhost:8000/auth/user', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            localStorage.setItem('user_data', JSON.stringify(userData.user));
            
            // Redirect to home page
            router.push('/');
          } else {
            throw new Error('Failed to fetch user data');
          }
        }
      } catch (error) {
        console.error('Callback error:', error);
        alert('Authentication failed. Please try again.');
        router.push('/');
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Completing authentication...</h2>
        <p className="text-gray-500 mt-2">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
