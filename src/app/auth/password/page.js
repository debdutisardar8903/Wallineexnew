'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

function PasswordForm() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Use auth context directly
  const { login } = useAuth() || { login: null };
  
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (!emailParam) {
      // If no email, redirect back to auth page
      router.push('/auth');
      return;
    }
    setEmail(emailParam);
  }, [searchParams, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Login button clicked', { password: !!password, login: !!login });
    
    if (!password) {
      console.log('No password provided');
      return;
    }
    
    if (!login) {
      console.log('Auth login function not available');
      return;
    }

    setIsLoading(true);
    
    try {
      // Login using Firebase auth
      await login(email, password);
      
      // Redirect to original page or home
      router.push(redirect);
    } catch (error) {
      console.error('Login failed:', error);
      // Handle specific Firebase auth errors
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      }
      alert(errorMessage); // You can replace this with a proper error display
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/auth?redirect=${encodeURIComponent(redirect)}`);
  };

  if (!email) {
    return (
      <div className="font-sans min-h-screen flex items-center justify-center p-8 bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 tracking-[-.01em]">Loading...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-semibold tracking-[-.01em] mb-2">Enter your password</h1>
          <p className="text-sm/6 text-gray-600 tracking-[-.01em]">
            Welcome back, <span className="font-medium">{email}</span>
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 tracking-[-.01em]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 border border-black/[.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors text-sm tracking-[-.01em]"
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!password || isLoading}
            className="w-full rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-12 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Forgot Password */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push(`/auth/forgot-password?redirect=${encodeURIComponent(redirect)}`)}
            className="text-sm text-gray-600 hover:text-black hover:underline hover:underline-offset-4 tracking-[-.01em]"
            disabled={isLoading}
          >
            Forgot your password?
          </button>
        </div>

        {/* Back button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-sm text-gray-600 mx-auto tracking-[-.01em]"
            disabled={isLoading}
          >
            ← Back to email
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PasswordPage() {
  return (
    <Suspense fallback={
      <div className="font-sans min-h-screen flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PasswordForm />
    </Suspense>
  );
}
