"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react"
import API from "../services/api"
import { toast } from "react-toastify"

export default function AttendanceCalendar() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  useEffect(() => {
    fetchCalendarData()
  }, [currentMonth, currentYear])

  const fetchCalendarData = async () => {
    setLoading(true)
    try {
      const res = await API.get(`/attendance/calendar/${currentMonth}/${currentYear}`)
      setCalendarData(res.data.calendarData || {})
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      toast.error("Failed to load calendar data")
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getLocalDateString = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const getStatusColor = (date) => {
    const dateStr = getLocalDateString(date)
    const record = calendarData[dateStr]

    if (!record) {
      return "bg-gray-100 text-gray-600"
    }

    if (!record.isPresent) {
      return "bg-red-600 text-white border-2 border-red-700"
    }

    if (record.workingHours >= 6) {
      return "bg-green-100 text-green-700 border-2 border-green-300"
    }

    return "bg-pink-200 text-pink-800 border-2 border-pink-300"
  }

  const getStatusLabel = (date) => {
    const dateStr = getLocalDateString(date)
    const record = calendarData[dateStr]

    if (!record) {
      return "No Data"
    }

    if (!record.isPresent) {
      return "Absent"
    }

    return `${record.workingHours}h`
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentYear, currentMonth - 1, i))
  }

  const selectedDateRecord = selectedDate ? calendarData[getLocalDateString(selectedDate)] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Attendance Calendar</h1>
            <p className="text-blue-100 mt-1">View your working hours for each day</p>
          </div>
          <Clock className="w-12 h-12 opacity-50" />
        </div>
      </div>

      {/* Calendar Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {user?.name} • {user?.employeeId}
            </p>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Today Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Today
          </button>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
            <span className="text-sm text-gray-700">≥ 6 hours (Present)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-pink-200 border-2 border-pink-300 rounded"></div>
            <span className="text-sm text-gray-700">{"< 6 hours (Partial)"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-600 border-2 border-red-700 rounded"></div>
            <span className="text-sm text-gray-700">Absent</span>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((date, index) => (
                <div
                  key={index}
                  onClick={() => date && setSelectedDate(date)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all ${
                    date ? getStatusColor(date) : "bg-gray-50"
                  } ${
                    selectedDate && date && selectedDate.toDateString() === date.toDateString()
                      ? "ring-2 ring-blue-500 ring-offset-2"
                      : ""
                  }`}
                >
                  {date && (
                    <>
                      <div className="text-sm font-semibold">{date.getDate()}</div>
                      <div className="text-xs mt-1">{getStatusLabel(date)}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>

            {selectedDateRecord ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Check In:</span>
                  <span className="font-semibold text-gray-900">{selectedDateRecord.checkIn || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Check Out:</span>
                  <span className="font-semibold text-gray-900">{selectedDateRecord.checkOut || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Working Hours:</span>
                  <span
                    className={`font-semibold ${selectedDateRecord.workingHours >= 6 ? "text-green-600" : "text-pink-600"}`}
                  >
                    {selectedDateRecord.workingHours} hours
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-gray-900 capitalize">{selectedDateRecord.status}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>No attendance record for this date</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Month Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Full Days (≥6h)</p>
            <p className="text-2xl font-bold text-green-600">
              {Object.values(calendarData).filter((r) => r.isPresent && r.workingHours >= 6).length}
            </p>
          </div>
          <div className="bg-pink-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Partial Days ({"<6h"})</p>
            <p className="text-2xl font-bold text-pink-600">
              {Object.values(calendarData).filter((r) => r.isPresent && r.workingHours < 6).length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Absent Days</p>
            <p className="text-2xl font-bold text-red-600">
              {Object.values(calendarData).filter((r) => !r.isPresent).length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Hours</p>
            <p className="text-2xl font-bold text-blue-600">
              {Object.values(calendarData)
                .reduce((sum, r) => sum + (r.workingHours || 0), 0)
                .toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
