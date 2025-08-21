// File: src/components/SyllabusForm.tsx

"use client";
import { useState, FormEvent } from "react";
import { useRouter } from 'next/navigation'; // Import the router

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function SyllabusForm() {
  const router = useRouter(); // Initialize the router
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
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

      // ✅ --- SAVE AND REDIRECT LOGIC ---
      // 1. Save the successful result to the browser's session storage
      sessionStorage.setItem('studyPlanData', JSON.stringify(data.schedule));
      // 2. Clear any old progress from localStorage
      localStorage.removeItem('syllabusProgress');
      // 3. Navigate to the new results page
      router.push('/plan');

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error.");
      setIsLoading(false); // Stop loading only if there's an error
    } 
    // We don't set isLoading to false here, because the page will navigate away on success
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-200/80">
        <div className="mb-6 border-b border-gray-300/80 pb-4">
          <label htmlFor="syllabusFile" className="block text-indigo-700 font-semibold text-lg mb-2">
            1. Upload Syllabus <span className="text-sm text-gray-500">(PDF)</span>
          </label>
          <label htmlFor="syllabusFile" className="w-full text-sm text-indigo-500 cursor-pointer bg-indigo-50/80 rounded-full text-center p-3 border border-dashed border-indigo-300 block">
            <input type="file" id="syllabusFile" accept=".pdf" onChange={handleFileChange} className="hidden" />
            <span>{fileName || "Click to select a file"}</span>
          </label>
        </div>
        <div className="mb-6 border-b border-gray-300/80 pb-4">
          <label htmlFor="endDate" className="block text-purple-700 font-semibold text-lg mb-2">
            2. Select Completion Date
          </label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full p-3 bg-white/80 border border-purple-300 rounded-md text-purple-600"/>
        </div>
        <button type="submit" disabled={isLoading || !syllabusFile || !endDate} className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-md disabled:bg-slate-400 disabled:cursor-not-allowed">
          {isLoading ? <><Spinner /> Generating Plan...</> : "✨ Generate Study Plan ✨"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600 text-center font-semibold bg-white/80 p-4 rounded-xl shadow-lg">{error}</p>}
    </div>
  );
}