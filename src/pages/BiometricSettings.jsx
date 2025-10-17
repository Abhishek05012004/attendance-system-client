"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Fingerprint, Trash2, Plus, AlertCircle, Loader, Edit2 } from "lucide-react"
import API from "../services/api"
import BiometricEnroll from "../components/BiometricEnroll"

export default function BiometricSettings() {
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEnroll, setShowEnroll] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    fetchCredentials()
  }, [])

  const fetchCredentials = async () => {
    try {
      setLoading(true)
      const response = await API.get("/biometric/credentials")
      setCredentials(response.data.credentials || [])
    } catch (error) {
      console.error("Error fetching credentials:", error)
      toast.error("Failed to load biometric credentials")
    } finally {
      setLoading(false)
    }
  }

  const deleteCredential = async (credentialId) => {
    try {
      setDeleting(credentialId)
      await API.delete(`/biometric/credentials/${credentialId}`)
      toast.success("Credential removed successfully")
      fetchCredentials()
    } catch (error) {
      console.error("Error deleting credential:", error)
      toast.error("Failed to remove credential")
    } finally {
      setDeleting(null)
    }
  }

  const renameCredential = async (credentialId) => {
    try {
      if (!editName.trim()) {
        toast.error("Name cannot be empty")
        return
      }
      await API.put(`/biometric/credentials/${credentialId}`, { name: editName })
      toast.success("Credential renamed successfully")
      setEditingId(null)
      setEditName("")
      fetchCredentials()
    } catch (error) {
      console.error("Error renaming credential:", error)
      toast.error("Failed to rename credential")
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <Fingerprint className="h-8 w-8 text-blue-600" />
          Biometric Settings
        </h1>
        <p className="text-gray-600">Manage your fingerprint and biometric authentication methods</p>
      </div>

      {showEnroll ? (
        <div className="mb-8">
          <button
            onClick={() => setShowEnroll(false)}
            className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Credentials
          </button>
          <BiometricEnroll
            onSuccess={() => {
              setShowEnroll(false)
              fetchCredentials()
            }}
          />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Enrolled Credentials</h2>
              <button
                onClick={() => setShowEnroll(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Fingerprint
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : credentials.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <Fingerprint className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <p className="text-blue-900 font-medium mb-2">No biometric credentials enrolled</p>
                <p className="text-blue-700 text-sm mb-4">Add your fingerprint to enable biometric login</p>
                <button
                  onClick={() => setShowEnroll(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Enroll Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Fingerprint className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        {editingId === cred.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded"
                              autoFocus
                            />
                            <button
                              onClick={() => renameCredential(cred.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-gray-900">{cred.name}</p>
                            <p className="text-sm text-gray-500">
                              Added {new Date(cred.createdAt).toLocaleDateString()}
                              {cred.lastUsed && ` • Last used ${new Date(cred.lastUsed).toLocaleDateString()}`}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId !== cred.id && (
                        <button
                          onClick={() => {
                            setEditingId(cred.id)
                            setEditName(cred.name)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteCredential(cred.id)}
                        disabled={deleting === cred.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Device & Browser Support
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-2">Devices:</p>
                <ul className="space-y-1">
                  <li>✓ Windows Hello</li>
                  <li>✓ macOS Touch ID</li>
                  <li>✓ iOS Face ID / Touch ID</li>
                  <li>✓ Android Biometric</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Browsers:</p>
                <ul className="space-y-1">
                  <li>✓ Chrome 67+</li>
                  <li>✓ Firefox 60+</li>
                  <li>✓ Safari 13+</li>
                  <li>✓ Edge 18+</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
