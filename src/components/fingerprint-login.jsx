"use client"

import { useState } from "react"
import { Fingerprint, ArrowLeft, Loader } from "lucide-react"
import API from "../services/api"
import { toast } from "react-toastify"

export default function FingerprintLogin({ email, onBack, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [challenge, setChallenge] = useState(null)
  const [allowCredentials, setAllowCredentials] = useState([])

  const getAuthOptions = async () => {
    try {
      setLoading(true)
      const res = await API.post("/fingerprint/auth-options", { email })
      setChallenge(res.data.challenge)
      setAllowCredentials(res.data.allowCredentials)
      return res.data
    } catch (error) {
      console.error("Auth options error:", error)
      toast.error(error.response?.data?.error || "Failed to get authentication options")
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleFingerprintAuth = async () => {
    try {
      setLoading(true)

      // Get auth options
      const options = await getAuthOptions()
      if (!options) return

      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        toast.error("WebAuthn is not supported on this device")
        return
      }

      // Prepare assertion options
      const assertionOptions = {
        challenge: Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0)),
        allowCredentials: options.allowCredentials.map((cred) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
        })),
        timeout: options.timeout || 60000,
        userVerification: options.userVerification || "preferred",
      }

      // Get assertion from authenticator
      const assertion = await navigator.credentials.get({
        publicKey: assertionOptions,
      })

      if (!assertion) {
        toast.error("Fingerprint authentication cancelled")
        return
      }

      // Extract data from assertion
      const credentialId = btoa(String.fromCharCode.apply(null, new Uint8Array(assertion.id)))
      const signature = btoa(String.fromCharCode.apply(null, new Uint8Array(assertion.response.signature)))
      const clientData = btoa(String.fromCharCode.apply(null, new Uint8Array(assertion.response.clientDataJSON)))
      const counter = assertion.response.getTransports ? assertion.response.getTransports()[0] : 0

      // Send to backend for verification
      const authRes = await API.post("/fingerprint/authenticate", {
        email,
        credentialId,
        signature,
        clientData,
        counter,
        challenge: options.challenge,
      })

      toast.success("Fingerprint authentication successful!")
      onSuccess(authRes.data.token, authRes.data.user)
    } catch (error) {
      console.error("Fingerprint auth error:", error)
      toast.error(error.response?.data?.error || "Fingerprint authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Password Login
      </button>

      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
          <Fingerprint className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Fingerprint Login</h3>
        <p className="text-gray-600 text-sm">Use your fingerprint to login securely</p>
      </div>

      <button
        onClick={handleFingerprintAuth}
        disabled={loading}
        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <Fingerprint className="h-4 w-4" />
            Scan Fingerprint
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">Place your finger on the scanner when prompted by your device</p>
    </div>
  )
}
