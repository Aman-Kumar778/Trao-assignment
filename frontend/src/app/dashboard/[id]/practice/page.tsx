"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { Kit, Flashcard } from "@traq/shared";
import Link from "next/link";
import {
  RotateCcw,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Award
} from "lucide-react";

export default function PracticeModePage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id as string;

  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  const fetchKit = async () => {
    try {
      const data = await apiFetch(`/api/kits/${kitId}`);
      const rawKit: Kit = data.kit;
      setKit(rawKit);

      // CONFIDENCE-WEIGHTED RESURFACING:
      // Sort unpracticed cards (confidence undefined or 0) and low-confidence cards (confidence 1-2) first!
      const sortedCards = [...(rawKit.flashcards || [])].sort((a, b) => {
        const confA = a.confidence ?? 0;
        const confB = b.confidence ?? 0;
        return confA - confB;
      });

      setCards(sortedCards);
    } catch (err) {
      console.error("Failed to load kit for practice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKit();
  }, [kitId]);

  // Keyboard navigation: Space/Enter to flip, 1-3 for ratings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completed || cards.length === 0) return;

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") handleRating(1);
        if (e.key === "2") handleRating(3);
        if (e.key === "3") handleRating(5);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, completed, cards, currentIndex]);

  const handleRating = async (confidenceScore: number) => {
    if (cards.length === 0) return;

    const currentCard = cards[currentIndex];
    currentCard.confidence = confidenceScore;

    // Update in local kit state and sync PATCH to backend
    if (kit) {
      const updatedFlashcards = kit.flashcards.map((f) =>
        f.id === currentCard.id ? { ...f, confidence: confidenceScore } : f
      );
      const updatedKit = { ...kit, flashcards: updatedFlashcards };
      setKit(updatedKit);

      apiFetch(`/api/kits/${kitId}`, {
        method: "PATCH",
        body: JSON.stringify(updatedKit)
      }).catch((err) => console.error("Failed to save confidence rating:", err));
    }

    setIsFlipped(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const currentCard = cards[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0b0f19]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm">Loading practice session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar />

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-between">
        <div>
          <Link
            href={`/dashboard/${kitId}`}
            className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Kit Details
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                Confidence-Weighted Practice
              </span>
              <h1 className="text-2xl font-bold text-white mt-2">Flashcard Mastery Session</h1>
            </div>

            {cards.length > 0 && !completed && (
              <span className="text-sm font-semibold text-gray-400 bg-gray-900 px-3.5 py-1.5 rounded-xl border border-gray-800">
                Card {currentIndex + 1} of {cards.length}
              </span>
            )}
          </div>
        </div>

        {/* PRACTICE CONTENT */}
        {completed ? (
          <div className="glass-panel rounded-3xl p-10 text-center max-w-lg mx-auto my-auto border border-gray-800 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              <Award className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Practice Session Completed!</h2>
            <p className="text-sm text-gray-400 mb-6">
              You reviewed all {cards.length} flashcards. Confidence ratings have been saved to target your weak spots next session.
            </p>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setCompleted(false);
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl border border-gray-700 flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repeat Session</span>
              </button>

              <Link
                href={`/dashboard/${kitId}`}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-xl"
              >
                Return to Kit
              </Link>
            </div>
          </div>
        ) : currentCard ? (
          <div className="my-auto space-y-6">
            {/* Interactive Flip Card */}
            <div
              onClick={() => setIsFlipped((prev) => !prev)}
              className="glass-panel rounded-3xl p-8 sm:p-12 min-h-[320px] flex flex-col justify-between cursor-pointer border border-gray-800 hover:border-blue-500/50 transition-all duration-300 shadow-2xl group relative select-none"
            >
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-mono bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">
                  {currentCard.id}
                </span>
                <span className="text-gray-500 group-hover:text-blue-400 transition-colors">
                  {isFlipped ? "Answer Back" : "Question Front (Click or press Space to flip)"}
                </span>
              </div>

              <div className="my-auto py-6">
                {!isFlipped ? (
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                    {currentCard.front}
                  </h3>
                ) : (
                  <p className="text-base sm:text-lg text-emerald-300 leading-relaxed whitespace-pre-line font-medium">
                    {currentCard.back}
                  </p>
                )}
              </div>

              <div className="text-center text-xs text-gray-500">
                {!isFlipped ? "Tap card to reveal answer outline" : "Rate your recall confidence below"}
              </div>
            </div>

            {/* Confidence Rating Bar */}
            {isFlipped && (
              <div className="glass-panel rounded-2xl p-4 border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  How confident were you?
                </span>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleRating(1)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all"
                  >
                    1 - Low (Needs Review)
                  </button>
                  <button
                    onClick={() => handleRating(3)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all"
                  >
                    2 - Medium
                  </button>
                  <button
                    onClick={() => handleRating(5)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
                  >
                    3 - High (Mastered)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">No flashcards available in this kit.</p>
          </div>
        )}

        {/* Footer shortcuts helper */}
        <div className="text-center text-xs text-gray-500 py-4 border-t border-gray-800/60 mt-8">
          Keyboard shortcuts: <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Space</kbd> / <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Enter</kbd> to flip • <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">1</kbd>, <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">2</kbd>, <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">3</kbd> for confidence ratings
        </div>
      </div>
    </div>
  );
}
