"use client"

import { useEffect, useRef, useState } from "react"
import API from "../services/api"

const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights"

export default function FaceModal({ open, mode = "verify", onClose, onVerified, onEnrolled }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [modelsReady, setModelsReady] = useState(false)

  useEffect(() => {
    if (!open) return
    let stream
    const start = async () => {
      try {
        setError("")
        // lazy-load face-api
        const faceapi = (await import("face-api.js")).default || (await import("face-api.js"))
        // load models once
        if (!modelsReady) {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          ])
          setModelsReady(true)
        }
        // camera
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (e) {
        setError("Unable to access camera. Please allow camera permissions.")
        console.error("[v0] Face camera error:", e)
      }
    }
    start()
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [open, modelsReady])

  const captureAndProcess = async () => {
    setLoading(true)
    setError("")
    try {
      const faceapi = (await import("face-api.js")).default || (await import("face-api.js"))
      const video = videoRef.current
      if (!video) return
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        setError("No face detected. Please align your face in the frame.")
        setLoading(false)
        return
      }

      // draw for feedback
      if (canvasRef.current) {
        const dims = faceapi.matchDimensions(canvasRef.current, video, true)
        const resized = faceapi.resizeResults(detection, dims)
        faceapi.draw.drawDetections(canvasRef.current, resized)
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resized)
      }

      const embedding = Array.from(detection.descriptor)
      if (mode === "enroll") {
        console.log("[v0] Enrolling face with embedding length:", embedding.length)
        const res = await API.post("/face/enroll", { embedding, modelVersion: "face-api-0.22.2" })
        onEnrolled?.(res.data.user)
      } else {
        console.log("[v0] Verifying face with embedding length:", embedding.length)
        const res = await API.post("/face/verify", { embedding })
        if (res.data.verified) {
          onVerified?.(embedding)
        } else {
          setError("Face did not match. Please try again.")
          return
        }
      }
      onClose?.()
    } catch (e) {
      console.error("[v0] Face processing error:", e)
      setError("Failed to process face. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{mode === "enroll" ? "Enroll Your Face" : "Face Verification"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="p-5">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Center your face, ensure good lighting, and keep still. We will capture one frame to{" "}
            {mode === "enroll" ? "enroll" : "verify"}.
          </p>
          {error && <p className="text-sm mt-2 text-red-600">{error}</p>}
          <div className="mt-4 flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-md border">
              Cancel
            </button>
            <button
              onClick={captureAndProcess}
              disabled={loading || !modelsReady}
              className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? "Processing..." : mode === "enroll" ? "Capture & Enroll" : "Capture & Verify"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
