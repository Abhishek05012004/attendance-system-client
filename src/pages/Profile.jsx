"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { toast } from "react-toastify"
import { User, Mail, Phone, MapPin, Building, Briefcase, Calendar, Save, Fingerprint, Trash2, Plus } from "lucide-react"
import API from "../services/api"
import FingerprintRegister from "../components/fingerprint-register"
import { getAuthToken } from "../services/api"

export default function Profile() {
  const { user, updateUser } = useAuth()
  const authToken = getAuthToken()
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    position: "",
  })
  const [loading, setLoading] = useState(false)
  const [showFingerprintModal, setShowFingerprintModal] = useState(false)
  const [fingerprintData, setFingerprintData] = useState({
    enrolled: false,
    credentials: [],
  })
  const [fingerprintLoading, setFingerprintLoading] = useState(false)

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
  }, [user])

  useEffect(() => {
    fetchFingerprintData()
  }, [])

  const fetchFingerprintData = async () => {
    try {
      const res = await API.get("/fingerprint/list")
      setFingerprintData({
        enrolled: res.data.fingerprintEnrolled,
        credentials: res.data.credentials || [],
      })
    } catch (error) {
      console.error("Error fetching fingerprint data:", error)
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

  const handleRemoveFingerprint = async (credentialId) => {
    if (!window.confirm("Are you sure you want to remove this fingerprint?")) {
      return
    }

    try {
      setFingerprintLoading(true)
      await API.delete(`/fingerprint/${credentialId}`)
      toast.success("Fingerprint removed successfully!")
      await fetchFingerprintData()
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove fingerprint")
    } finally {
      setFingerprintLoading(false)
    }
  }

  const handleFingerprintSuccess = () => {
    setShowFingerprintModal(false)
    fetchFingerprintData()
    toast.success("Fingerprint registered successfully!")
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-green-600" />
            Fingerprint Authentication
          </h2>
          <button
            onClick={() => setShowFingerprintModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Fingerprint
          </button>
        </div>

        {showFingerprintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <FingerprintRegister
                onClose={() => setShowFingerprintModal(false)}
                onSuccess={handleFingerprintSuccess}
                isModal={true}
                token={authToken}
              />
            </div>
          </div>
        )}

        {fingerprintData.enrolled ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✓ Fingerprint authentication is enabled. You can login using your fingerprint.
              </p>
            </div>

            {fingerprintData.credentials.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Registered Fingerprints:</h3>
                {fingerprintData.credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{cred.deviceName}</p>
                      <p className="text-xs text-gray-500">
                        Registered on {new Date(cred.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFingerprint(cred.id)}
                      disabled={fingerprintLoading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              No fingerprints registered yet. Click "Add Fingerprint" to enable fingerprint authentication.
            </p>
          </div>
        )}
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
    </div>
  )
}
