// File: src/app/dashboard/page.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/firebase/config';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

// --- (Navbar Component - No Changes, assuming it's correct) ---
const Navbar = ({ user, onLogout }: { user: User | null; onLogout: () => void; }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const getLinkClass = (path: string) => {
    return pathname === path
      ? "bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium"
      : "text-gray-700 hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium";
  };
  return (
    <nav className="bg-white shadow-md w-full sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center"><div className="flex-shrink-0"><span className="text-2xl font-bold text-indigo-600">🎓 StudyPlanner AI</span></div></div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <Link href="/dashboard" className={getLinkClass("/dashboard")}>Home</Link>
              <Link href="/syllabus" className={getLinkClass("/syllabus")}>Syllabus Planner</Link>
              <Link href="/" className={getLinkClass("/")}>Features</Link>
              <Link href="/" className={getLinkClass("/")}>About</Link>
              {user && (<button onClick={onLogout} className="text-gray-700 hover:bg-red-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Logout</button>)}
            </div>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-indigo-500 focus:outline-none">
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">{isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}</svg>
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/dashboard" className={`${getLinkClass("/dashboard")} block`}>Home</Link>
            <Link href="/syllabus" className={`${getLinkClass("/syllabus")} block`}>Syllabus Planner</Link>
            <Link href="/" className={`${getLinkClass("/")} block`}>Features</Link>
            <Link href="/" className={`${getLinkClass("/")} block`}>About</Link>
            {user && <button onClick={onLogout} className="w-full text-left text-gray-700 hover:bg-red-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Logout</button>}
          </div>
        </div>
      )}
    </nav>
  );
};

// --- Main Dashboard Page Component ---
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [quickTestTopic, setQuickTestTopic] = useState("");
  const [testType, setTestType] = useState("MCQ"); // ✅ State for test type

  const mockTestHistory = [
    { id: 1, subject: "Cyber Security", score: 42, totalMarks: 50, date: "2024-08-26" },
  ];
  const [testHistory, setTestHistory] = useState(mockTestHistory);

  useEffect(() => {
    const newResult = sessionStorage.getItem('newTestResult');
    if (newResult) {
        const result = JSON.parse(newResult);
        setTestHistory(prevHistory => [result, ...prevHistory]);
        sessionStorage.removeItem('newTestResult');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleStartSyllabusTest = () => {
    router.push('/syllabus'); 
  };
  
  // ✅ Updated submit handler to include test type
  const handleQuickTestSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (quickTestTopic.trim()) {
        router.push(`/quick-test/${testType}/${encodeURIComponent(quickTestTopic.trim())}`);
    }
  };

  const getScoreColor = (score: number, totalMarks: number) => {
    const percentage = (score / totalMarks) * 100;
    if (percentage >= 80) return "text-green-600 bg-green-100";
    if (percentage >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  if (loadingUser) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
             <h1 className="text-4xl font-bold text-gray-900">Welcome, {user?.displayName || user?.email}!</h1>
             <p className="mt-2 text-lg text-gray-600">What would you like to do today?</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg border h-full flex flex-col">
              <h2 className="text-xl font-semibold text-gray-800">Syllabus Planner</h2>
              <p className="mt-2 text-gray-600 flex-grow">Generate a comprehensive study plan and final exam from a PDF syllabus.</p>
              <div className="mt-auto pt-4">
                <button onClick={handleStartSyllabusTest} className="w-full px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                  Plan from Syllabus
                </button>
              </div>
            </div>
          </div>

          {/* ✅ Card 2: Updated Quick Test */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg border h-full flex flex-col">
              <h2 className="text-xl font-semibold text-gray-800">Quick Test</h2>
              <p className="mt-2 text-gray-600 flex-grow">Enter a topic and choose a test type for a quick 10-minute review.</p>
              <form onSubmit={handleQuickTestSubmit} className="mt-auto pt-4 space-y-4">
                <input
                    type="text"
                    value={quickTestTopic}
                    onChange={(e) => setQuickTestTopic(e.target.value)}
                    placeholder="e.g., Python Loops"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                />
                {/* ✅ Radio buttons for test type */}
                <div className="flex justify-around">
                    <label className="flex items-center space-x-2">
                        <input type="radio" name="testType" value="MCQ" checked={testType === 'MCQ'} onChange={(e) => setTestType(e.target.value)} />
                        <span>MCQs</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input type="radio" name="testType" value="SAQ" checked={testType === 'SAQ'} onChange={(e) => setTestType(e.target.value)} />
                        <span>Short Answers</span>
                    </label>
                </div>
                <button type="submit" className="w-full px-6 py-3 text-lg font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700">
                  Start Quick Test
                </button>
              </form>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg border h-full">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Test History</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {testHistory.length > 0 ? (
                  testHistory.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100">
                      <div>
                        <p className="font-semibold text-gray-900">{test.subject}</p>
                        <p className="text-sm text-gray-500">{new Date(test.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                         <p className={`font-bold text-lg px-3 py-1 rounded-full ${getScoreColor(test.score, test.totalMarks)}`}>
                           {test.score} / {test.totalMarks}
                         </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No tests taken yet.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
