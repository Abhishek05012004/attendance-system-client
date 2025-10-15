"use client"

import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import { useState } from "react"
import { X } from "lucide-react"

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar backdrop"
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] md:hidden">
            <div className="bg-white h-full shadow-lg border-r border-gray-200 relative">
              {/* Close button (X) */}
              <button
                type="button"
                aria-label="Close sidebar"
                className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
              <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
