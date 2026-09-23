"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, LogOut, Plus, BookOpen, User } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-800 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 group-hover:border-blue-500/60 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
            Traq <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-normal">AI Kit</span>
          </span>
        </Link>

        {user && (
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/new"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-3.5 py-2 rounded-xl transition-all duration-200 shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Prep Kit</span>
            </Link>

            <div className="h-4 w-px bg-gray-800" />

            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-300">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="hidden sm:inline font-medium text-xs text-gray-300">{user.email}</span>
            </div>

            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
