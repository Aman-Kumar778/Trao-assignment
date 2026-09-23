"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { Plus, BookOpen, Clock, Calendar, CheckCircle2, AlertCircle, Loader2, Sparkles, ArrowRight, Trash2 } from "lucide-react";

interface KitSummary {
  _id: string;
  status: "generating" | "ready" | "failed";
  stage?: string;
  kit?: {
    source: {
      role: string;
      company: string;
    };
    schedule: {
      days_available: number;
    };
  };
  error?: {
    message: string;
  };
  createdAt: string;
}

export default function DashboardPage() {
  const [kits, setKits] = useState<KitSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKits = async () => {
    try {
      const data = await apiFetch("/api/kits");
      setKits(data.kits || []);
    } catch (err) {
      console.error("Failed to fetch kits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKits();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this prep kit?")) return;

    try {
      await apiFetch(`/api/kits/${id}`, { method: "DELETE" });
      setKits((prev) => prev.filter((k) => k._id !== id));
    } catch (err) {
      alert("Failed to delete kit.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Your Interview Kits</h1>
            <p className="text-sm text-gray-400 mt-1">Manage and practice your AI-generated interview preparation kits</p>
          </div>

          <Link
            href="/dashboard/new"
            className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Kit</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm">Loading your interview kits...</p>
          </div>
        ) : kits.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center max-w-xl mx-auto my-12 border border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Interview Kits Yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Paste any job description and company URL to generate a custom interview preparation kit with tailored questions, flashcards, and a day-by-day study schedule.
            </p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Kit</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kits.map((k) => {
              const roleTitle = k.kit?.source?.role || "Interview Prep Kit";
              const companyName = k.kit?.source?.company || "Company";
              const days = k.kit?.schedule?.days_available || 5;
              const formattedDate = new Date(k.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              });

              return (
                <Link
                  key={k._id}
                  href={k.status === "generating" ? `/dashboard/generating/${k._id}` : `/dashboard/${k._id}`}
                  className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between group relative border border-gray-800"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-xs font-semibold text-blue-400 tracking-wide uppercase">
                          {companyName}
                        </span>
                        <h2 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 mt-0.5">
                          {roleTitle}
                        </h2>
                      </div>

                      {k.status === "ready" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                        </span>
                      )}

                      {k.status === "generating" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating
                        </span>
                      )}

                      {k.status === "failed" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <AlertCircle className="w-3 h-3 mr-1" /> Failed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-400 mb-6">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>{days} Day Plan</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-800/80">
                    <span className="text-xs font-medium text-blue-400 flex items-center group-hover:translate-x-1 transition-transform">
                      {k.status === "generating" ? "View Progress" : "Open Kit"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </span>

                    <button
                      onClick={(e) => handleDelete(e, k._id)}
                      title="Delete Kit"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
