"use client";

import { useEffect, useState } from "react";
import { auth } from "@/firebase/config";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

// Simple card component
const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
    <div className="text-4xl mb-4 text-indigo-600">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-indigo-600">
                🎓 StudyPlanner AI
              </a>
            </div>
            <div className="flex items-center space-x-4">
              {!authInitialized ? (
                <span className="text-gray-500">Loading...</span>
              ) : user ? (
                <>
                  <a
                    href="/syllabusform"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Go to Dashboard
                  </a>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </a>
                  <a
                    href="/signup"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Sign Up
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-white">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Transform Your Syllabus into a{" "}
            <span className="text-indigo-600">Smart Study Plan</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            Stop guessing what to study next. Upload your course syllabus, and
            let our AI create a personalized, day-by-day schedule to keep you on
            track for success.
          </p>
          <div className="mt-8 flex justify-center">
            {!user && authInitialized && (
              <a
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 shadow-lg transform hover:-translate-y-1 transition-transform"
              >
                Get Started for Free
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Features */}
      <main className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A simple, three-step process to academic organization.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon="📄"
              title="1. Upload Syllabus"
              description="Simply upload your course syllabus in PDF format. Our AI gets to work instantly, reading and understanding all the topics, deadlines, and assignments."
            />
            <FeatureCard
              icon="🎯"
              title="2. Set Your Goal"
              description="Tell us your target completion date or exam day. Our planner intelligently distributes the workload, ensuring you cover everything without last-minute cramming."
            />
            <FeatureCard
              icon="🗓️"
              title="3. Get Your Plan"
              description="Receive a detailed, interactive study schedule. Track your progress, mark topics as complete, and stay motivated on your path to acing your exams."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              &copy; {new Date().getFullYear()} StudyPlanner AI. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
