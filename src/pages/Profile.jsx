"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { toast } from "react-toastify"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Save,
  Fingerprint,
  Plus,
  Trash2,
  Edit2,
  Loader,
  AlertCircle,
} from "lucide-react"
import API from "../services/api"
import BiometricEnroll from "../components/BiometricEnroll"

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    position: "",
  })
  const [loading, setLoading] = useState(false)

  const [biometricCredentials, setBiometricCredentials] = useState([])
  const [biometricLoading, setBiometricLoading] = useState(true)
  const [showBiometricEnroll, setShowBiometricEnroll] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        department: user.department || "",
        position: user.position || "",
      })
    }
    fetchBiometricCredentials()
  }, [user])

  const fetchBiometricCredentials = async () => {
    try {
      setBiometricLoading(true)
      const response = await API.get("/biometric/credentials")
      setBiometricCredentials(response.data.credentials || [])
    } catch (error) {
      console.error("Error fetching biometric credentials:", error)
      // Don't show error toast on initial load
    } finally {
      setBiometricLoading(false)
    }
  }

  const deleteBiometricCredential = async (credentialId) => {
    try {
      setDeleting(credentialId)
      await API.delete(`/biometric/credentials/${credentialId}`)
      toast.success("Fingerprint removed successfully")
      fetchBiometricCredentials()
    } catch (error) {
      console.error("Error deleting credential:", error)
      toast.error("Failed to remove fingerprint")
    } finally {
      setDeleting(null)
    }
  }

  const renameBiometricCredential = async (credentialId) => {
    try {
      if (!editName.trim()) {
        toast.error("Name cannot be empty")
        return
      }
      await API.put(`/biometric/credentials/${credentialId}`, { name: editName })
      toast.success("Fingerprint renamed successfully")
      setEditingId(null)
      setEditName("")
      fetchBiometricCredentials()
    } catch (error) {
      console.error("Error renaming credential:", error)
      toast.error("Failed to rename fingerprint")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userId = user._id || user.id
      const res = await API.put(`/users/${userId}`, profile)
      updateUser(res.data.user)
      toast.success("Profile updated successfully!")
    } catch (err) {
      console.error("Profile update error:", err)
      toast.error(err.response?.data?.error || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setProfile({ ...profile, [field]: value })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-gray-600">
              {user?.employeeId} • {user?.position}
            </p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          <User className="w-6 h-6 text-blue-600" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  style={{ color: "#111827", backgroundColor: "#ffffff" }}
                  value={profile.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  style={{ color: "#111827", backgroundColor: "#ffffff" }}
                  value={profile.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  style={{ color: "#111827", backgroundColor: "#ffffff" }}
                  value={profile.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="department"
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  style={{ color: "#111827", backgroundColor: "#ffffff" }}
                  value={profile.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  placeholder="Enter your department"
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="position"
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  style={{ color: "#111827", backgroundColor: "#ffffff" }}
                  value={profile.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  placeholder="Enter your position"
                />
              </div>
            </div>

            {/* Employee ID (Read-only) */}
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="employeeId"
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-900"
                  style={{ color: "#111827", backgroundColor: "#f9fafb" }}
                  value={user?.employeeId || ""}
                  disabled
                  placeholder="Employee ID"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="address"
                rows={3}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
                value={profile.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter your address"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-blue-600" />
            Fingerprint Authentication
          </h2>
        </div>

        {showBiometricEnroll ? (
          <div>
            <button
              onClick={() => setShowBiometricEnroll(false)}
              className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              ← Back to Fingerprints
            </button>
            <BiometricEnroll
              onSuccess={() => {
                setShowBiometricEnroll(false)
                fetchBiometricCredentials()
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 text-sm">Manage your fingerprint credentials for biometric login</p>
              <button
                onClick={() => setShowBiometricEnroll(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Fingerprint
              </button>
            </div>

            {biometricLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : biometricCredentials.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <Fingerprint className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <p className="text-blue-900 font-medium mb-2">No fingerprints enrolled</p>
                <p className="text-blue-700 text-sm mb-4">Add your fingerprint to enable biometric login</p>
                <button
                  onClick={() => setShowBiometricEnroll(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Enroll Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {biometricCredentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => renameBiometricCredential(cred.id)}
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
                          title="Rename fingerprint"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteBiometricCredential(cred.id)}
                        disabled={deleting === cred.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete fingerprint"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Device Support Info */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                Supported Devices & Browsers
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs text-blue-800">
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
    </div>
  )
}
