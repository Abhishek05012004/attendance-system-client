"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Calendar as CalendarIcon } from "lucide-react"
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
    const dayOfWeek = date.getDay()
    const record = calendarData[dateStr]

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "bg-gray-50 text-gray-500 border border-gray-200"
    }

    if (!record) {
      return "bg-red-50 text-red-700 border border-red-200"
    }

    if (!record.isPresent) {
      return "bg-red-50 text-red-700 border border-red-200"
    }

    if (record.workingHours >= 6) {
      return "bg-green-50 text-green-700 border border-green-200"
    }

    return "bg-amber-50 text-amber-700 border border-amber-200"
  }

  const getStatusIcon = (date) => {
    const dateStr = getLocalDateString(date)
    const dayOfWeek = date.getDay()
    const record = calendarData[dateStr]

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "🏖️"
    }

    if (!record || !record.isPresent) {
      return "❌"
    }

    if (record.workingHours >= 6) {
      return "✅"
    }

    return "⏱️"
  }

  const getStatusLabel = (date) => {
    const dateStr = getLocalDateString(date)
    const dayOfWeek = date.getDay()
    const record = calendarData[dateStr]

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "Weekend"
    }

    if (!record) {
      return "No Record"
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
    setSelectedDate(new Date())
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

  // Calculate summary statistics
  const fullDays = Object.values(calendarData).filter((r) => r.isPresent && r.workingHours >= 6).length
  const partialDays = Object.values(calendarData).filter((r) => r.isPresent && r.workingHours < 6).length
  const absentDays = Object.values(calendarData).filter((r) => !r.isPresent).length
  const totalHours = Object.values(calendarData).reduce((sum, r) => sum + (r.workingHours || 0), 0).toFixed(1)

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Attendance Calendar</h1>
                    <p className="text-blue-100 mt-1 text-sm sm:text-base">
                      View your working hours and attendance history
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-4 text-sm text-white/90">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>Full Day</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                    <span>Partial Day</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    <span>Absent</span>
                  </span>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-white/20">
                <p className="text-white font-semibold text-sm">{user?.name}</p>
                <p className="text-blue-100 text-xs mt-1">{user?.employeeId}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Container */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Month Navigation */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 active:scale-95"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <h2 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">
                    {monthName}
                  </h2>
                  
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 active:scale-95"
                    title="Next month"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={handleToday}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 active:scale-95 text-sm shadow-sm"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="p-6">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="text-center font-semibold text-gray-500 py-3 text-sm uppercase tracking-wide"
                    >
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
                      className={`
                        aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-200 text-sm
                        ${date ? getStatusColor(date) : "bg-transparent"}
                        ${date ? "hover:scale-105 hover:shadow-md" : ""}
                        ${
                          selectedDate &&
                          date &&
                          selectedDate.toDateString() === date.toDateString()
                            ? "ring-2 ring-blue-500 ring-offset-2 scale-105 shadow-md"
                            : ""
                        }
                        ${date && date.getDate() === new Date().getDate() && 
                          currentDate.getMonth() === new Date().getMonth() && 
                          currentDate.getFullYear() === new Date().getFullYear()
                            ? "ring-2 ring-blue-300"
                            : ""
                        }
                      `}
                    >
                      {date && (
                        <>
                          <div className="flex flex-col items-center justify-center w-full h-full p-1">
                            <div className="text-lg font-bold mb-1">{date.getDate()}</div>
                            <div className="text-xs mb-1">{getStatusIcon(date)}</div>
                            <div className="text-xs font-medium text-center leading-tight">
                              {getStatusLabel(date)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Details */}
            {selectedDate && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Date Details</span>
                </h3>

                <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {selectedDateRecord ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Check In</p>
                        <p className="font-semibold text-gray-900 text-sm">
                          {selectedDateRecord.checkIn || "N/A"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Check Out</p>
                        <p className="font-semibold text-gray-900 text-sm">
                          {selectedDateRecord.checkOut || "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Working Hours</p>
                      <p className={`text-xl font-bold ${
                        selectedDateRecord.workingHours >= 6 ? "text-green-600" : "text-amber-600"
                      }`}>
                        {selectedDateRecord.workingHours} hours
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <p className="font-semibold text-gray-900 capitalize text-sm">
                        {selectedDateRecord.status}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 text-amber-600 bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">No attendance record</p>
                      <p className="text-xs text-amber-500 mt-1">
                        No attendance data found for this date
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Month Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-green-700 mb-1">Full Days (≥6h)</p>
                  <p className="text-2xl font-bold text-green-700">{fullDays}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                  <p className="text-xs text-amber-700 mb-1">Partial Days ({'<6h'})</p>
                  <p className="text-2xl font-bold text-amber-700">{partialDays}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                  <p className="text-xs text-red-700 mb-1">Absent Days</p>
                  <p className="text-2xl font-bold text-red-700">{absentDays}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">Total Hours</p>
                  <p className="text-2xl font-bold text-blue-700">{totalHours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}