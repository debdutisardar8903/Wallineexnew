'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth() || { resetPassword: null };
  
  const redirect = searchParams.get('redirect') || '/';

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !resetPassword) return;

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      await resetPassword(email);
      setIsEmailSent(true);
    } catch (error) {
      console.error('Password reset failed:', error);
      // Handle specific Firebase auth errors
      let errorMsg = 'Failed to send reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Too many requests. Please try again later.';
      }
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push(`/auth?redirect=${encodeURIComponent(redirect)}`);
  };

  if (isEmailSent) {
    return (
      <div className="font-sans min-h-screen flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/next.svg"
              alt="Logo"
              width={120}
              height={32}
              className="mx-auto mb-6"
            />
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-.01em] mb-2">Check your email</h1>
            <p className="text-sm/6 text-gray-600 tracking-[-.01em] mb-6">
              We've sent a password reset link to <span className="font-medium">{email}</span>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-medium text-sm mb-3 tracking-[-.01em]">Next steps:</h3>
            <ol className="text-sm/6 text-gray-600 space-y-2 tracking-[-.01em]">
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">1.</span>
                Check your email inbox (and spam folder)
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">2.</span>
                Click the reset link in the email
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">3.</span>
                Create a new password
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => {
                setIsEmailSent(false);
                setEmail('');
              }}
              className="w-full rounded-full border border-solid border-black/[.08] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] hover:border-transparent font-medium text-sm sm:text-base h-12 px-5"
            >
              Send another email
            </button>
            
            <button
              onClick={handleBackToLogin}
              className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-sm text-gray-600 mx-auto tracking-[-.01em]"
            >
              ← Back to login
            </button>
          </div>
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
          <h1 className="text-2xl font-semibold tracking-[-.01em] mb-2">Forgot your password?</h1>
          <p className="text-sm/6 text-gray-600 tracking-[-.01em]">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 tracking-[-.01em]">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage('');
              }}
              required
              className="w-full px-4 py-3 border border-black/[.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors text-sm tracking-[-.01em]"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          {errorMessage && (
            <div className="text-red-600 text-sm tracking-[-.01em]">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={!email || isLoading}
            className="w-full rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-12 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        {/* Back to login */}
        <div className="mt-8 text-center">
          <button
            onClick={handleBackToLogin}
            className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-sm text-gray-600 mx-auto tracking-[-.01em]"
            disabled={isLoading}
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="font-sans min-h-screen flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
