'use client'

import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import axios from 'axios'

interface Estate {
  estate_id: string
  encrypted_data: string
  status: string
  created_at?: string
  last_heartbeat?: string
}

export function EstateDashboard() {
  const { address } = useAccount()
  const [estates, setEstates] = useState<Estate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address) {
      fetchEstates()
    }
  }, [address])

  const fetchEstates = async () => {
    if (!address) return

    setLoading(true)
    try {
      // In a full implementation, this would fetch from the smart contract
      // For now, we'll show a placeholder
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/estate/${address}`
      )
      setEstates([response.data])
    } catch (err) {
      // Estate might not exist yet
      setEstates([])
    } finally {
      setLoading(false)
    }
  }

  const handleHeartbeat = async () => {
    if (!address) return

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/heartbeat`,
        {
          user_address: address,
          api_source: '', // Would come from estate data
          verification_params: {},
        }
      )
      fetchEstates()
    } catch (err) {
      console.error('Heartbeat failed:', err)
    }
  }

  if (loading) {
    return <div className="text-gray-400">Loading estates...</div>
  }

  if (estates.length === 0) {
    return (
      <div className="text-gray-400 text-center py-8">
        No estates found. Create one to get started.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {estates.map((estate) => (
        <div
          key={estate.estate_id}
          className="bg-gray-700 rounded-lg p-4 border border-gray-600"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-white">
              Estate #{estate.estate_id.slice(0, 8)}...
            </h3>
            <span
              className={`px-2 py-1 rounded text-xs ${
                estate.status === 'active'
                  ? 'bg-green-900/50 text-green-200'
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {estate.status}
            </span>
          </div>
          {estate.last_heartbeat && (
            <p className="text-sm text-gray-400 mb-4">
              Last heartbeat: {new Date(estate.last_heartbeat).toLocaleString()}
            </p>
          )}
          <button
            onClick={handleHeartbeat}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded transition"
          >
            Verify Heartbeat
          </button>
        </div>
      ))}
    </div>
  )
}

