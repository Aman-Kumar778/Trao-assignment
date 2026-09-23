"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { Kit, Question, Flashcard, Requirement } from "@traq/shared";
import Link from "next/link";
import {
  Sparkles,
  Building2,
  Briefcase,
  HelpCircle,
  BookOpen,
  Calendar,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Star
} from "lucide-react";

type ActiveTab = "brief" | "role" | "questions" | "flashcards" | "schedule";

export default function KitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id as string;

  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("brief");
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchKit = async () => {
    try {
      const data = await apiFetch(`/api/kits/${kitId}`);
      if (data.status === "generating") {
        router.push(`/dashboard/generating/${kitId}`);
        return;
      }
      setKit(data.kit);
    } catch (err) {
      console.error("Failed to load kit:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKit();
  }, [kitId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRegenerate = async (section: string) => {
    setRegeneratingSection(section);
    try {
      const data = await apiFetch(`/api/kits/${kitId}/regenerate`, {
        method: "POST",
        body: JSON.stringify({ section })
      });
      setKit(data.kit);
      showToast(data.summary || "Section regenerated successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to regenerate section.");
    } finally {
      setRegeneratingSection(null);
    }
  };

  const toggleQuestionOutline = (qId: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0b0f19]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm">Loading interview kit...</p>
        </div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0b0f19]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Kit Not Found</h2>
          <p className="text-sm mb-6">The requested interview kit could not be loaded.</p>
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const roleTitle = kit.role?.title || "Software Developer";
  const companyName = kit.source?.company || "Company";
  const uncoveredCount = kit.coverage?.uncovered_requirement_ids?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-sm animate-bounce border border-blue-400/40">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Dashboard
        </Link>

        {/* Kit Header */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 mb-8 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                {companyName}
              </span>
              {uncoveredCount === 0 ? (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> 100% Requirement Coverage
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" /> {uncoveredCount} Uncovered Must-Have
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">{roleTitle}</h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Researched on {new Date(kit.source.researched_at).toLocaleDateString()} • {kit.questions.length} Questions • {kit.flashcards.length} Flashcards • {kit.schedule.days_available} Days
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/dashboard/${kitId}/practice`}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center space-x-2 text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Flashcard Practice</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-gray-800 mb-8 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("brief")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "brief"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Company Brief</span>
          </button>

          <button
            onClick={() => setActiveTab("role")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "role"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Role & Requirements</span>
          </button>

          <button
            onClick={() => setActiveTab("questions")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "questions"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Question Bank ({kit.questions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("flashcards")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "flashcards"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Flashcards ({kit.flashcards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "schedule"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule ({kit.schedule.days_available} Days)</span>
          </button>
        </div>

        {/* TAB 1: Company Brief */}
        {activeTab === "brief" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Company Intelligence Brief</h3>
              <button
                onClick={() => handleRegenerate("brief")}
                disabled={regeneratingSection === "brief"}
                className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-blue-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${regeneratingSection === "brief" ? "animate-spin" : ""}`} />
                <span>Regenerate Brief</span>
              </button>
            </div>

            <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 border border-gray-800">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">Summary Overview</h4>
                <p className="text-sm text-gray-200 leading-relaxed">{kit.company_brief.summary}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">What They Do</h4>
                <p className="text-sm text-gray-200 leading-relaxed">{kit.company_brief.what_they_do}</p>
              </div>

              {kit.company_brief.sources && kit.company_brief.sources.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Sources Crawled</h4>
                  <div className="flex flex-wrap gap-2">
                    {kit.company_brief.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:underline bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
                      >
                        <span>{src}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Role & Requirements */}
        {activeTab === "role" && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-gray-800 space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-gray-800">
                <div>
                  <h3 className="text-xl font-bold text-white">{kit.role.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">Seniority Level: <span className="text-gray-200 font-medium">{kit.role.seniority}</span></p>
                </div>
              </div>

              {kit.role.responsibilities && kit.role.responsibilities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">Key Responsibilities</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                    {kit.role.responsibilities.map((res, idx) => (
                      <li key={idx} className="leading-relaxed">{res}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-4">Extracted Requirements</h4>
                <div className="space-y-3">
                  {kit.role.requirements.map((req) => {
                    const isCovered = !kit.coverage.uncovered_requirement_ids.includes(req.id);

                    return (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex items-start justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-mono font-bold text-gray-400">[{req.id}]</span>
                            <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                              req.priority === "must"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}>
                              {req.priority}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">({req.kind})</span>
                          </div>
                          <p className="text-sm font-medium text-gray-200">{req.text}</p>
                        </div>

                        {req.priority === "must" && (
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${
                            isCovered
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {isCovered ? "Covered" : "Uncovered"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Question Bank */}
        {activeTab === "questions" && (
          <div className="space-y-8">
            {(["technical", "behavioural", "system-design", "company-fit"] as const).map((cat) => {
              const catQuestions = kit.questions.filter((q) => q.category === cat);

              return (
                <div key={cat} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white capitalize flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>{cat.replace("-", " ")} Questions ({catQuestions.length})</span>
                    </h3>

                    <button
                      onClick={() => handleRegenerate(cat)}
                      disabled={regeneratingSection === cat}
                      className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-blue-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${regeneratingSection === cat ? "animate-spin" : ""}`} />
                      <span>Regenerate Category</span>
                    </button>
                  </div>

                  {catQuestions.length === 0 ? (
                    <p className="text-xs text-gray-500 italic p-4 rounded-xl bg-gray-900/40 border border-gray-800/60">
                      No questions generated for this category.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {catQuestions.map((q) => {
                        const isExpanded = expandedQuestions[q.id];
                        const isEdited = q._meta?.origin === "user_edited" || q._meta?.origin === "user_added";

                        return (
                          <div
                            key={q.id}
                            className="glass-panel rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                                  {q.id}
                                </span>
                                {isEdited && (
                                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    Pinned (User Edited)
                                  </span>
                                )}
                                <div className="flex items-center space-x-1 ml-2">
                                  {Array.from({ length: 3 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < q.difficulty ? "text-amber-400 fill-amber-400" : "text-gray-700"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>

                              <button
                                onClick={() => toggleQuestionOutline(q.id)}
                                className="text-xs text-blue-400 hover:underline flex items-center space-x-1"
                              >
                                <span>{isExpanded ? "Hide Answer Outline" : "Show Answer Outline"}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            <p className="text-base font-semibold text-white mb-3 leading-snug">{q.prompt}</p>

                            <div className="flex items-center space-x-2 text-xs text-gray-400 mb-3">
                              <span>Linked Requirements:</span>
                              {q.requirement_ids.map((rid) => (
                                <span key={rid} className="bg-gray-800 text-blue-400 px-2 py-0.5 rounded font-mono">
                                  {rid}
                                </span>
                              ))}
                            </div>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-800 bg-gray-900/60 p-4 rounded-xl text-sm text-gray-300 leading-relaxed whitespace-pre-line border border-gray-800/80">
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Answer Outline & Key Points</h5>
                                {q.answer_outline}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: Flashcards */}
        {activeTab === "flashcards" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Revision Flashcards</h3>
              <Link
                href={`/dashboard/${kitId}/practice`}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Practice Mode</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kit.flashcards.map((card) => (
                <div key={card.id} className="glass-panel rounded-2xl p-6 border border-gray-800 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded mb-3 inline-block">
                      {card.id}
                    </span>
                    <h4 className="text-sm font-semibold text-white mb-3">{card.front}</h4>
                    <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/80 p-3.5 rounded-xl border border-gray-800 whitespace-pre-line">
                      {card.back}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Schedule */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{kit.schedule.days_available}-Day Master Preparation Plan</h3>
              <button
                onClick={() => handleRegenerate("schedule")}
                disabled={regeneratingSection === "schedule"}
                className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-blue-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${regeneratingSection === "schedule" ? "animate-spin" : ""}`} />
                <span>Re-allocate Schedule</span>
              </button>
            </div>

            <div className="space-y-4">
              {kit.schedule.days.map((day) => (
                <div key={day.day} className="glass-panel rounded-2xl p-6 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-lg shrink-0">
                      D{day.day}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white mb-1">{day.focus}</h4>
                      <p className="text-xs text-gray-400">
                        {day.question_ids.length} Questions Assigned • {day.minutes} Total Minutes
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {day.question_ids.map((qid) => (
                      <span key={qid} className="text-xs font-mono text-gray-300 bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800">
                        {qid}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
