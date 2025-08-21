// File: src/components/SyllabusForm.tsx

"use client";
import { useState, FormEvent } from "react";

type PlanItem = {
  week: number;
  topic: string;
  tasks: string[];
};

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function SyllabusForm() {
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [studyPlan, setStudyPlan] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSyllabusFile(file);
    setFileName(file ? file.name : "");
  };

  const handleSubmit = async (e: FormEvent) => {
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
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "An unknown server error.");
      }
      if (data.schedule) {
        setStudyPlan(data.schedule);
      } else {
        throw new Error("Received an invalid format from the server.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-8 border border-gray-200/80">
        <div className="mb-6 border-b border-gray-300/80 pb-4">
          <label htmlFor="syllabusFile" className="block text-indigo-700 font-semibold text-lg mb-2">
            1. Upload Syllabus <span className="text-sm text-gray-500">(PDF)</span>
          </label>
          <label
            htmlFor="syllabusFile"
            className="w-full text-sm text-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer bg-indigo-50/80 rounded-full text-center p-3 border border-dashed border-indigo-300 block"
          >
            <input
              type="file"
              id="syllabusFile"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <span>{fileName || "Click to select a file"}</span>
          </label>
        </div>

        <div className="mb-6 border-b border-gray-300/80 pb-4">
          <label htmlFor="endDate" className="block text-purple-700 font-semibold text-lg mb-2">
            2. Select Completion Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full p-3 bg-white/80 border border-purple-300 rounded-md text-purple-600 form-input-interactive"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !syllabusFile || !endDate}
          className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-md disabled:bg-slate-400 disabled:cursor-not-allowed btn-interactive"
        >
          {isLoading ? <><Spinner /> Generating Plan...</> : "✨ Generate Study Plan ✨"}
        </button>
      </form>

      <div className="space-y-6">
        {error && <p className="text-red-600 text-center font-semibold bg-white/80 p-4 rounded-xl shadow-lg">{error}</p>}
        {studyPlan.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-200/80">
            <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">🎉 Your Personalized Study Plan 🎉</h2>
            <div className="space-y-8">
              {studyPlan.map((item) => (
                <div key={item.week} className="border-l-4 border-lime-400 pl-6 study-plan-item">
                  <div className="flex items-center mb-2">
                    <div className="bg-lime-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 shadow-md">
                      {item.week}
                    </div>
                    <h3 className="text-xl font-semibold text-blue-700">{item.topic}</h3>
                  </div>
                  <ul className="list-disc list-inside mt-2 text-gray-700 space-y-2">
                    {item.tasks.map((task, index) => (
                      <li key={index} className="pl-2">
                        <span className="text-orange-600 font-medium">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
