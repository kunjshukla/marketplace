"use client";

import { useState, useEffect } from 'react';

export default function SimpleTest() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    setMessage('JavaScript is working!');
    const timer = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">React Test Page</h1>
      <div className="space-y-4">
        <div>Message: {message}</div>
        <div>Counter: {count}</div>
        <button 
          onClick={() => setCount(prev => prev + 10)}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          Add 10
        </button>
      </div>
    </div>
  );
}
