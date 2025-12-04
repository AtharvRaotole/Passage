'use client'

import { usePrivy } from '@privy-io/react-auth'
import { LogOut, User } from 'lucide-react'

export function LoginComponent() {
  const { login, authenticated, user, logout } = usePrivy()

  if (authenticated && user) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-neutral-600" />
          </div>
          <p className="font-medium text-neutral-900 mb-1">
            {user.email?.address || 'Connected'}
          </p>
          {user.wallet?.address && (
            <p className="text-sm text-neutral-500 mb-6">
              {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
            </p>
          )}
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-8 max-w-md w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Sign in to continue
        </h2>
        <p className="text-neutral-500 text-sm">
          Access your digital estate dashboard
        </p>
      </div>
      
      <button
        onClick={login}
        className="w-full bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
      >
        Sign in
      </button>
      
      <p className="mt-4 text-center text-xs text-neutral-400">
        Continue with email, Google, or wallet
      </p>
    </div>
  )
}

export function LoginButton() {
  const { login, authenticated, user, logout } = usePrivy()

  if (authenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-600">
          {user.email?.address || (user.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 'Connected')}
        </span>
        <button
          onClick={logout}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={login}
      className="bg-neutral-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
    >
      Sign in
    </button>
  )
}
