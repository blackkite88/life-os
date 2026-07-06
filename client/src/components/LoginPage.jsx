import React from 'react';
import { API_URL } from '../config';

export default function LoginPage({ onLoginSuccess }) {
  const [checking, setChecking] = React.useState(false);

  const handleGoogleLogin = () => {
    // Open Google OAuth popup
    const popup = window.open(`${API_URL}/api/auth/google`, 'Google Login', 'width=500,height=600');
    setChecking(true);

    // Poll to check if authenticated
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/status`, { cache: 'no-store' });
        const data = await res.json();
        if (data.authenticated) {
          clearInterval(interval);
          if (popup && !popup.closed) popup.close();
          onLoginSuccess();
        }
      } catch (err) {
        console.error("Error checking auth status", err);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center transform transition-all duration-500 hover:scale-[1.01]">
        <h1 className="text-3xl font-bold text-[var(--color-accent)] mb-2">Personal Life OS</h1>
        <p className="text-gray-400 mb-8">Your intelligent, unified digital brain.</p>

        <button
          onClick={handleGoogleLogin}
          disabled={checking}
          className="w-full flex justify-center items-center gap-3 px-4 py-4 bg-[#4285F4] text-white rounded-xl hover:bg-[#3367d6] transition-all shadow-lg font-medium text-lg disabled:opacity-75 disabled:cursor-wait"
        >
          {!checking && (
            <svg className="w-6 h-6 bg-white rounded-full p-[2px]" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {checking ? "Authorizing with Google..." : "Continue with Google"}
        </button>

        <p className="mt-6 text-xs text-gray-500">
          Secure authentication is required to sync your emails, documents, and calendar.
        </p>
      </div>
    </div>
  );
}
