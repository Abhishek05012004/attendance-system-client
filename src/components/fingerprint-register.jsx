"use client"

import { useState } from "react"
import { Fingerprint, Loader, Check, X } from "lucide-react"
import API from "../services/api"
import { toast } from "react-toastify"

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function base64UrlToArrayBuffer(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/")
  const padLen = (4 - (base64.length % 4)) % 4
  const padded = base64 + "=".repeat(padLen)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export default function FingerprintRegister({ onClose, onSuccess, isModal = false, token = null }) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState("ready")
  const [challenge, setChallenge] = useState(null)
  const [registrationOptions, setRegistrationOptions] = useState(null)

  const handleStartEnrollment = async () => {
    try {
      setLoading(true)

      // Get registration options from backend
      const res = await API.post("/fingerprint/register-options", {})

      console.log("[v0] Registration options received:", res.data)
      setChallenge(res.data.challenge)
      setRegistrationOptions(res.data)
      setStep("scanning")
    } catch (error) {
      console.error("[v0] Enrollment error:", error)
      toast.error(error.response?.data?.error || "Failed to start enrollment")
      setStep("ready")
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

      // If we don't have options yet, get them first
      if (!registrationOptions) {
        await handleStartEnrollment()
        return
      }

      const challengeBuffer = base64UrlToArrayBuffer(challenge)
      const userIdBuffer = base64UrlToArrayBuffer(registrationOptions.user.id)

      const creationOptions = {
        challenge: new Uint8Array(challengeBuffer),
        rp: {
          name: "Employee Attendance System",
          id: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
        },
        user: {
          id: new Uint8Array(userIdBuffer),
          name: registrationOptions.user.name,
          displayName: registrationOptions.user.displayName,
        },
        pubKeyCredParams: registrationOptions.pubKeyCredParams,
        timeout: 60000,
        attestation: "direct",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "preferred",
          residentKey: "preferred",
        },
      }

      const credential = await navigator.credentials.create({
        publicKey: creationOptions,
      })

      if (!credential) {
        toast.error("Fingerprint enrollment cancelled")
        setStep("scanning")
        return
      }

      const credentialId = arrayBufferToBase64Url(credential.id)
      const attestationObject = arrayBufferToBase64Url(credential.response.attestationObject)
      const clientDataJSON = arrayBufferToBase64Url(credential.response.clientDataJSON)
      const transports = credential.response.getTransports ? credential.response.getTransports() : []

      console.log("[v0] Credential ID:", credentialId)
      console.log("[v0] Sending fingerprint data to backend")

      const registerRes = await API.post("/fingerprint/register", {
        credentialId: credentialId.trim(), // Ensure no whitespace
        attestationObject,
        clientDataJSON,
        transports,
        challenge,
      })

      console.log("[v0] Fingerprint registered successfully:", registerRes.data)
      setStep("success")

      setTimeout(() => {
        onSuccess({
          credentialId,
          success: true,
        })
      }, 2000)
    } catch (error) {
      console.error("[v0] Fingerprint capture error:", error)
      toast.error(error.response?.data?.error || "Fingerprint enrollment failed")
      setStep("scanning")
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <div className="space-y-6">
      {step === "ready" && (
        <>
          {isModal && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Enroll Fingerprint</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
          )}

          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Fingerprint className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Register Your Fingerprint</h3>
            <p className="text-gray-600 text-sm">Add a fingerprint for quick and secure login</p>
          </div>

          <button
            onClick={handleStartEnrollment}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Initializing...
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
          {isModal && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Scan Your Fingerprint</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
          )}

          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Fingerprint className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Scan Your Fingerprint</h3>
            <p className="text-gray-600 text-sm">Place your finger on the scanner when ready</p>
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
                Capture Fingerprint
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
          <p className="text-gray-600 text-sm">You can now login using your fingerprint</p>
        </div>
      )}
    </div>
  )

  if (isModal) {
    return content
  }

  return content
}
