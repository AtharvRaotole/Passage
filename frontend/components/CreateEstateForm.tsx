'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import axios from 'axios'

interface EstateData {
  beneficiary: string
  heartbeatInterval: number
  apiSource: string
  estateData: Record<string, any>
}

export function CreateEstateForm() {
  const { address } = useAccount()
  const [formData, setFormData] = useState<EstateData>({
    beneficiary: '',
    heartbeatInterval: 86400, // 1 day default
    apiSource: '',
    estateData: {},
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) {
      setError('Please connect your wallet')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/estate`,
        {
          user_address: address,
          beneficiary_address: formData.beneficiary,
          heartbeat_interval: formData.heartbeatInterval,
          estate_data: formData.estateData,
          access_conditions: {
            // Lit Protocol access conditions
            // Example: require beneficiary signature
          },
          api_source: formData.apiSource,
        }
      )

      setSuccess(true)
      console.log('Estate created:', response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create estate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Beneficiary Address
        </label>
        <input
          type="text"
          value={formData.beneficiary}
          onChange={(e) =>
            setFormData({ ...formData, beneficiary: e.target.value })
          }
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0x..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Heartbeat Interval (seconds)
        </label>
        <input
          type="number"
          value={formData.heartbeatInterval}
          onChange={(e) =>
            setFormData({
              ...formData,
              heartbeatInterval: parseInt(e.target.value),
            })
          }
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={86400}
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Minimum: 86400 (1 day)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          API Source for Verification
        </label>
        <input
          type="url"
          value={formData.apiSource}
          onChange={(e) =>
            setFormData({ ...formData, apiSource: e.target.value })
          }
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://api.example.com/activity"
          required
        />
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-2 rounded">
          Estate created successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Creating...' : 'Create Estate'}
      </button>
    </form>
  )
}

