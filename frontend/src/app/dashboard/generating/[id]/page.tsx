"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Sparkles, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const PIPELINE_STAGES = [
  "Extracting requirements from job description...",
  "Crawling company site and career pages...",
  "Searching public discussion of interview process...",
  "Generating company brief...",
  "Generating category-specific question bank...",
  "Performing programmatic coverage check...",
  "Generating revision flashcards...",
  "Building optimal study schedule...",
  "Validating kit schema contract..."
];

export default function GeneratingProgressPage() {
  const router = useRouter();
  const params = useParams();
  const kitId = params.id as string;

  const [stage, setStage] = useState<string>("Initializing generation pipeline...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const data = await apiFetch(`/api/kits/${kitId}`);

        if (data.status === "ready") {
          router.push(`/dashboard/${kitId}`);
          return;
        }

        if (data.status === "failed") {
          setError(data.error?.message || "Generation pipeline failed.");
          return;
        }

        if (data.stage) {
          setStage(data.stage);
        }

        timer = setTimeout(pollStatus, 2000);
      } catch (err: any) {
        setError(err.message || "Failed to fetch generation status.");
      }
    };

    pollStatus();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [kitId, router]);

  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => stage.includes(s.split(" ")[0]));
  const progressPercent = currentStageIndex !== -1
    ? Math.min(100, Math.round(((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100))
    : 20;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar />

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        {!error ? (
          <div className="w-full glass-panel rounded-2xl p-8 sm:p-12 border border-gray-800 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Generating Interview Kit</h2>
            <p className="text-sm text-gray-400 mb-8">Our multi-agent pipeline is processing your role & company context</p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-900 rounded-full h-2.5 mb-6 overflow-hidden border border-gray-800">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Stage status indicator */}
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl py-3 px-4">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="font-medium">{stage}</span>
            </div>

            {/* Stage Checklist */}
            <div className="mt-8 pt-6 border-t border-gray-800 text-left space-y-2.5">
              {PIPELINE_STAGES.map((s, idx) => {
                const isDone = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={idx} className="flex items-center space-x-3 text-xs">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-700 flex-shrink-0" />
                    )}
                    <span className={isDone ? "text-gray-300" : isCurrent ? "text-blue-400 font-medium" : "text-gray-600"}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full glass-panel rounded-2xl p-8 sm:p-12 border border-red-500/30 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Generation Failed</h2>
            <p className="text-sm text-red-400 mb-6">{error}</p>

            <Link
              href="/dashboard/new"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Try Again</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
