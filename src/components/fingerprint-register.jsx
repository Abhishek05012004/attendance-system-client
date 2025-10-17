"use client"

import { useState } from "react"
import { Fingerprint, Loader, Check, X } from "lucide-react"
import API from "../services/api"
import { toast } from "react-toastify"

export default function FingerprintRegister({ onClose, onSuccess, isModal = false }) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState("ready")
  const [deviceName, setDeviceName] = useState("")

  const generateMockFingerprintData = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const handleStartEnrollment = async () => {
    try {
      if (!deviceName.trim()) {
        toast.error("Please enter a device name")
        return
      }

      setLoading(true)
      setStep("scanning")
    } catch (error) {
      console.error("[v0] Error starting enrollment:", error)
      toast.error("Failed to start enrollment")
      setStep("ready")
    } finally {
      setLoading(false)
    }
  }

  const handleFingerprintCapture = async () => {
    try {
      setLoading(true)

      const fingerprintData = generateMockFingerprintData()

      console.log("[v0] Fingerprint data generated:", fingerprintData)
      console.log("[v0] Sending fingerprint data to backend")

      const res = await API.post("/fingerprint/enroll", {
        fingerprintData: fingerprintData,
        deviceName: deviceName,
      })

      console.log("[v0] Fingerprint enrolled successfully:", res.data)
      setStep("success")

      setTimeout(() => {
        onSuccess({
          credentialId: res.data.credentialId,
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

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g., My Laptop, Office PC"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  Initializing...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" />
                  Start Enrollment
                </>
              )}
            </button>
          </div>
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

  return content
}
