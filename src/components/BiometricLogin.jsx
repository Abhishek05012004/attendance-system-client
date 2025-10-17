"use client"

import { useState, useRef } from "react"
import { toast } from "react-toastify"
import { Fingerprint, AlertCircle, Loader, Mail } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import API, { setAuthToken } from "../services/api"

export default function BiometricLogin() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [authStep, setAuthStep] = useState("idle") // idle, starting, scanning, complete
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()
  const challengeRef = useRef(null)

  const checkBrowserSupport = () => {
    if (!window.PublicKeyCredential) {
      setError("Your browser does not support biometric authentication")
      return false
    }
    return true
  }

  const startBiometricAuth = async (e) => {
    e.preventDefault()

    try {
      setError(null)
      setLoading(true)
      setAuthStep("starting")

      if (!checkBrowserSupport()) return

      if (!email) {
        throw new Error("Email is required")
      }

      // Step 1: Get authentication challenge from server
      const response = await API.post("/biometric/authenticate/start", { email })

      challengeRef.current = response.data.challenge
      const options = response.data

      setAuthStep("scanning")
      toast.info("Please scan your fingerprint...")

      // Step 2: Get assertion with WebAuthn
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0)),
          timeout: options.timeout,
          userVerification: options.userVerification,
          allowCredentials: options.allowCredentials.map((cred) => ({
            ...cred,
            id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
          })),
        },
      })

      if (!assertion) {
        throw new Error("Authentication was cancelled")
      }

      // Step 3: Send assertion to server for verification
      const assertionForServer = {
        id: btoa(String.fromCharCode(...new Uint8Array(assertion.id))),
        response: {
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))),
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))),
          signature: btoa(String.fromCharCode(...new Uint8Array(assertion.response.signature))),
          signCount: assertion.response.signCount,
        },
      }

      const authResponse = await API.post("/biometric/authenticate/complete", {
        email,
        assertion: assertionForServer,
        challenge: challengeRef.current,
      })

      setAuthStep("complete")
      setAuthToken(authResponse.data.token)
      login(authResponse.data.token, authResponse.data.user)
      toast.success("Biometric login successful!")

      setTimeout(() => {
        if (authResponse.data.user.role === "admin") {
          navigate("/admin")
        } else {
          navigate("/dashboard")
        }
      }, 1000)
    } catch (err) {
      console.error("Biometric auth error:", err)
      setAuthStep("idle")
      const errorMsg = err.response?.data?.error || err.message || "Authentication failed"
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-blue-100 p-4 rounded-full">
          <Fingerprint className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center mb-2">Biometric Login</h2>
      <p className="text-gray-600 text-center mb-6">Sign in with your fingerprint</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={startBiometricAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Mail className="h-4 w-4" />
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="Enter your email"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || authStep === "complete"}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
            authStep === "complete"
              ? "bg-green-600 text-white"
              : loading
                ? "bg-blue-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {authStep === "complete" ? (
            <>
              <Fingerprint className="h-5 w-5" />
              Login Successful
            </>
          ) : loading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              {authStep === "scanning" ? "Scanning..." : "Processing..."}
            </>
          ) : (
            <>
              <Fingerprint className="h-5 w-5" />
              Login with Fingerprint
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-sm text-blue-900 mb-2">Device Support:</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>✓ Windows Hello (Fingerprint)</li>
          <li>✓ macOS Touch ID</li>
          <li>✓ iOS Face ID / Touch ID</li>
          <li>✓ Android Biometric</li>
          <li>✓ Security Keys (FIDO2)</li>
        </ul>
      </div>
    </div>
  )
}
