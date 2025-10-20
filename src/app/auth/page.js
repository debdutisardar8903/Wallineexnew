'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function AuthForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Navigate to password page with email
    router.push(`/auth/password?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect)}`);
    setIsLoading(false);
  };

  return (
    <div className="font-sans min-h-screen flex items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/next.svg"
            alt="Logo"
            width={120}
            height={32}
            className="mx-auto mb-6"
          />
          <h1 className="text-2xl font-semibold tracking-[-.01em] mb-2">Welcome back</h1>
          <p className="text-sm/6 text-gray-600 tracking-[-.01em]">
            Enter your email to continue to your account
          </p>
        </div>

        {/* Email Form */}
        <form onSubmit={handleContinue} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 tracking-[-.01em]">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-black/[.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors text-sm tracking-[-.01em]"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!email || isLoading}
            className="w-full rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-12 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm/6 text-gray-600 tracking-[-.01em]">
            Don't have an account?{' '}
            <button 
              onClick={() => router.push(`/auth/signup?redirect=${encodeURIComponent(redirect)}`)}
              className="text-black hover:underline hover:underline-offset-4 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-sm text-gray-600 mx-auto tracking-[-.01em]"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="font-sans min-h-screen flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
