"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/config";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

// SVG Icon for the spinner
const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 
         0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 
         3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// SVG Icon for file upload
const UploadIcon = () => (
  <svg
    className="w-8 h-8 mb-4 text-gray-500"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 20 16"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 
         5.56 0 0 0 16 6.5 5.5 5.5 0 0 
         0 5.207 5.021C5.137 5.017 5.071 
         5 5 5a4 4 0 0 0 0 8h2.167M10 
         15V6m0 0L8 8m2-2 2 2"
    />
  </svg>
);

export default function SyllabusForm() {
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const router = useRouter();

  // 🔐 Protect route: check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login"); // redirect to login if not signed in
      } else {
        setUser(currentUser);
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

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
        throw new Error(data.error || "An unknown server error occurred.");
      }

      sessionStorage.setItem("studyPlanData", JSON.stringify(data.schedule));
      sessionStorage.setItem("syllabusText", data.syllabusText);
      localStorage.removeItem("syllabusProgress");

      router.push("/plan"); // ✅ Redirect after success
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingUser) {
    return <p className="text-center mt-10">Checking authentication...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* 🔵 Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-indigo-600">
                  🎓 StudyPlanner
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <a
                  href="/"
                  className="text-gray-700 hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Features
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  About
                </a>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:bg-red-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                ) : (
                  <a
                    href="/login"
                    className="text-gray-700 hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 📌 Main Content */}
      <main className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Create Your Personalized Study Plan
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Upload your syllabus, set a deadline, and let our AI generate a
              tailored study schedule just for you.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200/80">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: File Upload */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  <span className="text-indigo-600 font-bold">Step 1:</span>{" "}
                  Upload Your Syllabus
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  We'll analyze the content to create your plan. (PDF format
                  only)
                </p>
                <div
                  className="flex items-center justify-center w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <label
                    htmlFor="syllabusFile"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadIcon />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF (MAX. 5MB)</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      id="syllabusFile"
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {fileName && (
                  <div className="mt-4 text-center text-sm text-green-600 font-medium bg-green-50 p-3 rounded-lg">
                    File selected: {fileName}
                  </div>
                )}
              </div>

              {/* Step 2: End Date */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  <span className="text-indigo-600 font-bold">Step 2:</span> Set
                  Your Goal
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  When do you want to complete this syllabus?
                </p>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !syllabusFile || !endDate}
                className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <Spinner /> Generating Your Plan...
                  </>
                ) : (
                  "✨ Generate My Study Plan ✨"
                )}
              </button>
            </form>
            {error && (
              <div className="mt-6 text-center text-red-600 font-semibold bg-red-50 p-4 rounded-lg border border-red-200">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
