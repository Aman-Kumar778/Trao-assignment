import { Requirement, Question, Schedule, ScheduleDay } from "@traq/shared";

function getQuestionMinutes(difficulty: number): number {
  switch (difficulty) {
    case 1:
      return 10;
    case 2:
      return 15;
    case 3:
      return 20;
    default:
      return 15;
  }
}

export function buildSchedule(
  requirements: Requirement[],
  questions: Question[],
  daysAvailable: number
): Schedule {
  // Clamp days_available to a positive integer
  const totalDays = Math.max(1, Math.floor(daysAvailable));

  const reqMap = new Map<string, Requirement>();
  for (const r of requirements) {
    reqMap.set(r.id, r);
  }

  // Helper to determine if question is linked to any 'must' requirement
  const isMustQuestion = (q: Question): boolean => {
    return q.requirement_ids.some((rid) => reqMap.get(rid)?.priority === "must");
  };

  // Sort questions:
  // 1) Linked 'must' requirements first
  // 2) Higher difficulty (3 -> 2 -> 1)
  const sortedQuestions = [...questions].sort((a, b) => {
    const aMust = isMustQuestion(a) ? 1 : 0;
    const bMust = isMustQuestion(b) ? 1 : 0;
    if (aMust !== bMust) {
      return bMust - aMust;
    }
    return b.difficulty - a.difficulty;
  });

  // Initialize day buckets
  const days: ScheduleDay[] = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1,
    focus: "",
    question_ids: [],
    minutes: 0
  }));

  // Distribute questions across days using greedy load balancing
  for (const q of sortedQuestions) {
    const minMinutes = getQuestionMinutes(q.difficulty);

    // Find day bucket with least total minutes (tie-break favoring earlier day)
    let minDayIdx = 0;
    for (let i = 1; i < totalDays; i++) {
      if (days[i].minutes < days[minDayIdx].minutes) {
        minDayIdx = i;
      }
    }

    days[minDayIdx].question_ids.push(q.id);
    days[minDayIdx].minutes += minMinutes;
  }

  // Generate clear focus descriptions for each day
  const qMap = new Map<string, Question>();
  for (const q of questions) {
    qMap.set(q.id, q);
  }

  for (const d of days) {
    if (d.question_ids.length === 0) {
      d.focus = "Review & Flashcard Reinforcement";
    } else {
      const categories = new Set<string>();
      d.question_ids.forEach((qid) => {
        const q = qMap.get(qid);
        if (q) categories.add(q.category);
      });
      const catList = Array.from(categories).map((c) => c.replace("-", " "));
      d.focus = `${catList.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(" & ")} Preparation`;
    }
  }

  return {
    days_available: totalDays,
    days,
    _meta: {
      origin: "generated",
      generation_batch: 1
    }
  };
}
