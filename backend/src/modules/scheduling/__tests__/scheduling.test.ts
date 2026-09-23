import { buildSchedule } from "../index";
import { Requirement, Question } from "@traq/shared";

describe("Scheduling Module Unit Tests", () => {
  const reqs: Requirement[] = [
    { id: "r1", text: "React experience", kind: "technical", priority: "must" },
    { id: "r2", text: "Node.js experience", kind: "technical", priority: "must" },
    { id: "r3", text: "GraphQL bonus", kind: "technical", priority: "nice" }
  ];

  const questions: Question[] = [
    { id: "q1", requirement_ids: ["r1"], category: "technical", prompt: "React 1", answer_outline: "A1", difficulty: 3 },
    { id: "q2", requirement_ids: ["r2"], category: "technical", prompt: "Node 1", answer_outline: "A2", difficulty: 2 },
    { id: "q3", requirement_ids: ["r3"], category: "technical", prompt: "GraphQL 1", answer_outline: "A3", difficulty: 1 },
    { id: "q4", requirement_ids: ["r1"], category: "system-design", prompt: "Design React App", answer_outline: "A4", difficulty: 3 }
  ];

  it("should create exact days_available entries for 5-day schedule", () => {
    const schedule = buildSchedule(reqs, questions, 5);
    expect(schedule.days_available).toBe(5);
    expect(schedule.days).toHaveLength(5);
    schedule.days.forEach((d) => {
      expect(Number.isInteger(d.minutes)).toBe(true);
      expect(d.minutes).toBeGreaterThanOrEqual(0);
    });
  });

  it("should create exact days_available entries for 1-day schedule packing all must-haves", () => {
    const schedule = buildSchedule(reqs, questions, 1);
    expect(schedule.days_available).toBe(1);
    expect(schedule.days).toHaveLength(1);
    expect(schedule.days[0].question_ids).toHaveLength(4);
  });

  it("should create exact days_available entries for 60-day schedule without crashing", () => {
    const schedule = buildSchedule(reqs, questions, 60);
    expect(schedule.days_available).toBe(60);
    expect(schedule.days).toHaveLength(60);
  });
});
