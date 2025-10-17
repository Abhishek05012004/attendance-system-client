"use client"

import { useState, useRef } from "react"
import { toast } from "react-toastify"
import { Fingerprint, Check, AlertCircle, Loader } from "lucide-react"
import API from "../services/api"

export default function BiometricEnroll({ onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [credentialName, setCredentialName] = useState("My Fingerprint")
  const [enrollmentStep, setEnrollmentStep] = useState("idle") // idle, starting, scanning, complete
  const [error, setError] = useState(null)
  const challengeRef = useRef(null)

  const checkBrowserSupport = () => {
    if (!window.PublicKeyCredential) {
      setError("Your browser does not support biometric authentication")
      return false
    }
    return true
  }

  const startEnrollment = async () => {
    try {
      setError(null)
      setLoading(true)
      setEnrollmentStep("starting")

      if (!checkBrowserSupport()) return

      // Step 1: Get enrollment challenge from server
      const response = await API.post("/biometric/enroll/start", {
        credentialName,
      })

      challengeRef.current = response.data.challenge
      const options = response.data

      setEnrollmentStep("scanning")
      toast.info("Please scan your fingerprint on your device...")

      const rpID = options.rp.id

      // Step 2: Create credential with WebAuthn
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0)),
          rp: {
            name: options.rp.name,
            id: rpID, // Use server-provided RP ID
          },
          user: {
            id: Uint8Array.from(atob(options.user.id), (c) => c.charCodeAt(0)),
            name: options.user.name,
            displayName: options.user.displayName,
          },
          pubKeyCredParams: options.pubKeyCredParams,
          timeout: options.timeout,
          attestation: options.attestation,
          authenticatorSelection: options.authenticatorSelection,
        },
      })

      if (!credential) {
        throw new Error("Credential creation was cancelled")
      }

      // Step 3: Send credential to server for verification
      const credentialForServer = {
        id: btoa(String.fromCharCode(...new Uint8Array(credential.id))),
        response: {
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
          attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
          publicKey: credential.response.getPublicKey()
            ? btoa(String.fromCharCode(...new Uint8Array(credential.response.getPublicKey())))
            : null,
          signCount: credential.response.transports ? 0 : credential.response.signCount,
          transports: credential.response.transports || [],
        },
      }

      const enrollResponse = await API.post("/biometric/enroll/complete", {
        credential: credentialForServer,
        credentialName,
        challenge: challengeRef.current,
      })

      setEnrollmentStep("complete")
      toast.success("Biometric enrollment successful!")

      setTimeout(() => {
        setEnrollmentStep("idle")
        setCredentialName("My Fingerprint")
        if (onSuccess) onSuccess()
      }, 2000)
    } catch (err) {
      console.error("Enrollment error:", err)
      setEnrollmentStep("idle")
      const errorMsg = err.response?.data?.error || err.message || "Enrollment failed"
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

      <h2 className="text-2xl font-bold text-center mb-2">Enroll Biometric</h2>
      <p className="text-gray-600 text-center mb-6">Add your fingerprint for secure login</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Credential Name</label>
          <input
            type="text"
            value={credentialName}
            onChange={(e) => setCredentialName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="e.g., My Fingerprint"
          />
        </div>

        <button
          onClick={startEnrollment}
          disabled={loading || enrollmentStep === "complete"}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
            enrollmentStep === "complete"
              ? "bg-green-600 text-white"
              : loading
                ? "bg-blue-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {enrollmentStep === "complete" ? (
            <>
              <Check className="h-5 w-5" />
              Enrollment Complete
            </>
          ) : loading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              {enrollmentStep === "scanning" ? "Scanning..." : "Processing..."}
            </>
          ) : (
            <>
              <Fingerprint className="h-5 w-5" />
              Start Enrollment
            </>
          )}
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-sm text-blue-900 mb-2">Browser Support:</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>✓ Chrome/Edge 67+</li>
          <li>✓ Firefox 60+</li>
          <li>✓ Safari 13+ (macOS/iOS)</li>
          <li>✓ Android 7+</li>
        </ul>
      </div>
    </div>
  )
}
