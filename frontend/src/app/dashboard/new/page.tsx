"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Sparkles, Globe, FileText, Calendar, Upload, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewKitPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "batch">("single");

  // Single form fields
  const [jd, setJd] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Batch upload file
  const [batchFile, setBatchFile] = useState<File | null>(null);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!jd.trim()) {
      setError("Please paste a Job Description.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch("/api/kits", {
        method: "POST",
        body: JSON.stringify({
          jd,
          company_url: companyUrl,
          days
        })
      });

      router.push(`/dashboard/generating/${data.kitId}`);
    } catch (err: any) {
      setError(err.message || "Failed to start kit generation.");
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!batchFile) {
      setError("Please select a valid JSON batch cases file.");
      return;
    }

    setLoading(true);

    try {
      const text = await batchFile.text();
      const cases = JSON.parse(text);

      if (!Array.isArray(cases)) {
        throw new Error("Batch JSON must contain an array of case objects.");
      }

      // Process batch items sequentially
      for (const c of cases) {
        await apiFetch("/api/kits", {
          method: "POST",
          body: JSON.stringify({
            jd: c.jd,
            company_url: c.company_url || "",
            days: c.days || 5
          })
        });
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to process batch upload.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar />

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Generate Interview Kit</h1>
          <p className="text-sm text-gray-400 mt-1">Provide role context to generate a customized, staged interview prep kit</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center space-x-2 p-1.5 rounded-xl bg-gray-900 border border-gray-800 w-fit mb-8">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === "single"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Single Kit Generator
          </button>
          <button
            type="button"
            onClick={() => setMode("batch")}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === "batch"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Batch JSON Upload
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {mode === "single" ? (
          <form onSubmit={handleSingleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 border border-gray-800">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Job Description (JD) *
                </label>
                <span className="text-xs text-gray-500">{jd.length} characters</span>
              </div>
              <div className="relative">
                <textarea
                  rows={8}
                  required
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the full job description text here (responsibilities, requirements, qualifications)..."
                  className="w-full bg-gray-900/80 border border-gray-700/60 rounded-xl p-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-y"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Company URL (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="url"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full bg-gray-900/80 border border-gray-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Crawler will discover careers, engineering blog & culture pages</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Preparation Window (Days)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value, 10) || 5)}
                    className="w-full bg-gray-900/80 border border-gray-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Study schedule will balance must-haves across N days</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Prep Kit</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBatchSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 border border-gray-800">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Batch JSON File Upload
              </label>
              <div className="border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl p-8 text-center transition-colors bg-gray-900/50 cursor-pointer relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-white">
                  {batchFile ? batchFile.name : "Click or drag JSON batch cases file here"}
                </p>
                <p className="text-xs text-gray-500 mt-1">JSON format: Array of &#123; id, jd, company_url, days &#125;</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !batchFile}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Upload & Queue Batch Kits</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
