"use client"

import { useState } from "react"
import { Fingerprint, ArrowLeft, Loader, Check, X } from "lucide-react"
import API from "../services/api"
import { toast } from "react-toastify"

export default function FingerprintRegister({ onClose, onSuccess, isModal = false, token = null }) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState("device-name") // device-name, scanning, success
  const [deviceName, setDeviceName] = useState("")
  const [challenge, setChallenge] = useState(null)

  const handleStartEnrollment = async () => {
    if (!deviceName.trim()) {
      toast.error("Please enter a device name")
      return
    }

    try {
      setLoading(true)

      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      // Get registration options
      const res = await API.post("/fingerprint/register-options", { deviceName }, { headers })
      setChallenge(res.data.challenge)
      setStep("scanning")
    } catch (error) {
      console.error("Enrollment error:", error)
      toast.error(error.response?.data?.error || "Failed to start enrollment")
      setStep("device-name")
    } finally {
      setLoading(false)
    }
  }

  const handleFingerprintCapture = async () => {
    try {
      setLoading(true)

      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        toast.error("WebAuthn is not supported on this device")
        return
      }

      const creationOptions = {
        challenge: Uint8Array.from(atob(challenge), (c) => c.charCodeAt(0)),
        rp: {
          name: "Employee Attendance System",
          id: window.location.hostname,
        },
        user: {
          id: Uint8Array.from("user-id", (c) => c.charCodeAt(0)),
          name: "user@example.com",
          displayName: "User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        timeout: 60000,
        attestation: "direct",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "preferred",
        },
      }

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: creationOptions,
      })

      if (!credential) {
        toast.error("Fingerprint enrollment cancelled")
        setStep("device-name")
        return
      }

      // Extract data from credential
      const credentialId = btoa(String.fromCharCode.apply(null, new Uint8Array(credential.id)))
      const publicKey = btoa(String.fromCharCode.apply(null, new Uint8Array(credential.response.getPublicKey())))
      const transports = credential.response.getTransports ? credential.response.getTransports() : []

      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      // Send to backend
      const registerRes = await API.post(
        "/fingerprint/register",
        {
          credentialId,
          publicKey,
          counter: 0,
          transports,
          deviceName,
          challenge,
        },
        { headers },
      )

      setStep("success")

      setTimeout(() => {
        onSuccess({
          credentialId,
          deviceName,
          success: true,
        })
      }, 2000)
    } catch (error) {
      console.error("Fingerprint capture error:", error)
      toast.error(error.response?.data?.error || "Fingerprint enrollment failed")
      setStep("device-name")
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <div className="space-y-6">
      {step === "device-name" && (
        <>
          {isModal && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Register Fingerprint</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
          )}

          {!isModal && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}

          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Fingerprint className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Register Fingerprint</h3>
            <p className="text-gray-600 text-sm">Add a fingerprint for quick and secure login</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Device Name</label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., My Laptop, Office PC"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          <button
            onClick={handleStartEnrollment}
            disabled={loading || !deviceName.trim()}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4" />
                Start Enrollment
              </>
            )}
          </button>
        </>
      )}

      {step === "scanning" && (
        <>
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Fingerprint className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Scan</h3>
            <p className="text-gray-600 text-sm">Click the button below and place your finger on the scanner</p>
          </div>

          <button
            onClick={handleFingerprintCapture}
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
        </>
      )}

      {step === "success" && (
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Fingerprint Registered!</h3>
          <p className="text-gray-600 text-sm">Your fingerprint has been successfully registered</p>
        </div>
      )}
    </div>
  )

  if (isModal) {
    return content
  }

  return content
}
