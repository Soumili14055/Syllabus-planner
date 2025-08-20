// File: app/components/SyllabusForm.tsx
"use client"; // This is crucial - it marks this as a Client Component

import { useState } from "react";

// Define a type for our schedule plan
type PlanItem = {
  week: number;
  topic: string;
  tasks: string[];
};

export default function SyllabusForm() {
  // All state management and functions are now in this component
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [endDate, setEndDate] = useState<string>("");
  const [studyPlan, setStudyPlan] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusFile || !endDate) {
      setError("Please select a syllabus file and an end date.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setStudyPlan([]);
    const formData = new FormData();
    formData.append("syllabusFile", syllabusFile);
    formData.append("endDate", endDate);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to generate study plan.");
      }
      const data: PlanItem[] = await response.json();
      setStudyPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* --- FORM SECTION --- */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md mb-8"
      >
        <div className="mb-4">
          <label htmlFor="syllabusFile" className="block text-slate-700 font-medium mb-2">
            1. Upload your syllabus (PDF)
          </label>
          <input
            type="file"
            id="syllabusFile"
            accept=".pdf"
            onChange={(e) => setSyllabusFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="endDate" className="block text-slate-700 font-medium mb-2">
            2. Select your completion date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-md"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Generating Your Plan..." : "Generate Plan"}
        </button>
      </form>

      {/* --- DISPLAY SECTION --- */}
      {error && <p className="text-red-500 text-center">{error}</p>}
      {isLoading && <p className="text-center text-slate-600">Please wait, the AI is creating your personalized schedule...</p>}
      {studyPlan.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Your Study Plan</h2>
          <div className="space-y-6">
            {studyPlan.map((item) => (
              <div key={item.week} className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-slate-700">
                  Week {item.week}: {item.topic}
                </h3>
                <ul className="list-disc list-inside mt-2 text-slate-600 space-y-1">
                  {item.tasks.map((task, index) => (
                    <li key={index}>{task}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}