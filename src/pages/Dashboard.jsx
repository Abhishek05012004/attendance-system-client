"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { toast } from "react-toastify"
import { Clock, Calendar, TrendingUp, CheckCircle, XCircle, Timer, User, Building, Briefcase, Info } from "lucide-react"
import API from "../services/api"
import FaceModal from "../components/face-modal" // add FaceModal

export default function Dashboard() {
  const { user, updateUser } = useAuth() // need updateUser to set faceEnrolled after enrollment
  const [attendanceStatus, setAttendanceStatus] = useState({
    hasCheckedIn: false,
    hasCheckedOut: false,
    attendance: null,
    currentDate: null,
  })
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    totalHours: 0,
    averageHours: 0,
  })
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showFace, setShowFace] = useState(false) // modal visibility
  const [faceMode, setFaceMode] = useState("verify") // "verify" | "enroll"
  const faceEmbeddingRef = useRef(null) // requires useRef import

  useEffect(() => {
    fetchAttendanceStatus()
    fetchStats()

    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchAttendanceStatus = async () => {
    try {
      const res = await API.get("/attendance/status")
      console.log("Attendance status response:", res.data)
      setAttendanceStatus(res.data)
    } catch (error) {
      console.error("Error fetching attendance status:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await API.get("/attendance/stats")
      setStats(res.data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation is not supported")
        resolve(null) // Return null instead of rejecting
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.warn("Geolocation error:", error)
          resolve(null) // Return null instead of rejecting
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      )
    })
  }

  const handleCheckIn = async () => {
    setLoading(true)
    if (!user?.faceEnrolled) {
      setFaceMode("enroll")
      setShowFace(true)
      return
    }
    setFaceMode("verify")
    setShowFace(true)
  }

  const handleCheckOut = async () => {
    setLoading(true)
    if (!user?.faceEnrolled) {
      setFaceMode("enroll")
      setShowFace(true)
      return
    }
    setFaceMode("verify")
    setShowFace(true)
  }

  const proceedCheckIn = async (embedding) => {
    setLoading(true)
    try {
      const location = await getLocation()
      const clientNow = new Date()
      const payload = {
        clientTimestamp: clientNow.getTime(),
        clientLocalDate: clientNow.toLocaleDateString("en-CA"),
        clientLocalTime: clientNow.toLocaleTimeString("en-GB", { hour12: false }),
        clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        faceEmbedding: embedding,
        ...(location ? { location } : {}),
      }
      console.log("[v0] Proceeding check-in with face verification")
      const response = await API.post("/attendance/checkin", payload)
      toast.success("Checked in successfully!")
      await fetchAttendanceStatus()
    } catch (err) {
      console.error("Check-in error:", err)
      toast.error(err.response?.data?.message || "Error checking in")
    } finally {
      setLoading(false)
    }
  }

  const proceedCheckOut = async (embedding) => {
    setLoading(true)
    try {
      const location = await getLocation()
      const clientNow = new Date()
      const payload = {
        clientTimestamp: clientNow.getTime(),
        clientLocalDate: clientNow.toLocaleDateString("en-CA"),
        clientLocalTime: clientNow.toLocaleTimeString("en-GB", { hour12: false }),
        clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        faceEmbedding: embedding,
        ...(location ? { location } : {}),
      }
      console.log("[v0] Proceeding check-out with face verification")
      const response = await API.post("/attendance/checkout", payload)
      toast.success("Checked out successfully!")
      await fetchAttendanceStatus()
      await fetchStats()
    } catch (err) {
      console.error("Check-out error:", err)
      toast.error(err.response?.data?.message || "Error checking out")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time) => {
    return currentTime.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getCurrentStatus = () => {
    if (attendanceStatus.hasCheckedIn && attendanceStatus.hasCheckedOut) {
      return {
        text: "Work Completed",
        color: "bg-green-500",
        description: "You have completed your work for today",
      }
    } else if (attendanceStatus.hasCheckedIn && !attendanceStatus.hasCheckedOut) {
      return {
        text: "Currently Working",
        color: "bg-yellow-500",
        description: "You are currently at work",
      }
    } else {
      return {
        text: "Not Checked In",
        color: "bg-gray-400",
        description: "You haven't checked in today",
      }
    }
  }

  const currentStatus = getCurrentStatus()

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100 mt-1">
              {user?.position} • {user?.department}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatTime(currentTime)}</div>
            <div className="text-blue-100">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Check In/Out Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
            <Clock className="w-6 h-6 text-blue-600" />
          </div>

          <div className="space-y-4">
            {attendanceStatus.attendance && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Check In:</span>
                  <span className="font-medium text-gray-900">{attendanceStatus.attendance.checkIn || "--"}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-gray-600">Check Out:</span>
                  <span className="font-medium text-gray-900">{attendanceStatus.attendance.checkOut || "--"}</span>
                </div>
                {attendanceStatus.attendance.workingHours > 0 && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-600">Working Hours:</span>
                    <span className="font-medium text-green-600">{attendanceStatus.attendance.workingHours}h</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleCheckIn}
                disabled={loading || attendanceStatus.hasCheckedIn}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-colors ${
                  attendanceStatus.hasCheckedIn
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Check In
                  </>
                )}
              </button>

              <button
                onClick={handleCheckOut}
                disabled={loading || !attendanceStatus.hasCheckedIn || attendanceStatus.hasCheckedOut}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-colors ${
                  !attendanceStatus.hasCheckedIn || attendanceStatus.hasCheckedOut
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 mr-2" />
                    Check Out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
            <Timer className="w-6 h-6 text-blue-600" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${currentStatus.color}`}></div>
              <span className="text-sm font-medium text-gray-900">{currentStatus.text}</span>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">{currentStatus.description}</p>
              <div className="text-xs text-blue-600">
                Current Date: {attendanceStatus.currentDate || new Date().toISOString().split("T")[0]}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-3">Employee Information</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">ID:</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{user?.employeeId || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Department:</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{user?.department || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Position:</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{user?.position || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CLARIFIED Statistics - Monthly Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Statistics</h3>
          <div className="flex items-center space-x-2 text-blue-600">
            <Info className="w-4 h-4" />
            <span className="text-sm">
              Current Month: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Days Worked This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDays}</p>
                <p className="text-xs text-gray-500">Total attendance records</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present Days This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.presentDays}</p>
                <p className="text-xs text-gray-500">Days with check-in</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Hours This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHours}h</p>
                <p className="text-xs text-gray-500">Working hours logged</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageHours}h</p>
                <p className="text-xs text-gray-500">This month average</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Face Modal */}
      {showFace && (
        <FaceModal
          open={showFace}
          mode={faceMode}
          onClose={() => setShowFace(false)}
          onEnrolled={async (payload) => {
            try {
              if (payload && Array.isArray(payload)) {
                // Not expected in dashboard (we enroll via API), but handle gracefully
                await proceedCheckIn(payload)
                updateUser({ ...user, faceEnrolled: true })
              } else if (payload && payload.embedding) {
                await proceedCheckIn(payload.embedding)
                updateUser({ ...user, faceEnrolled: true })
              } else {
                // Fallback: show verify step (legacy)
                setFaceMode("verify")
                return
              }
              setShowFace(false)
            } catch (e) {
              // if check-in fails, keep modal closed and show error from proceedCheckIn
              console.error("[v0] Inline enroll+checkin failed:", e)
            } finally {
              setLoading(false)
            }
          }}
          onVerified={(embedding) => {
            setShowFace(false)
            if (!attendanceStatus.hasCheckedIn) {
              proceedCheckIn(embedding)
            } else if (!attendanceStatus.hasCheckedOut) {
              proceedCheckOut(embedding)
            }
          }}
        />
      )}
    </div>
  )
}
