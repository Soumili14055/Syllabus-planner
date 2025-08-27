"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation"; // ✅ Import usePathname
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { auth } from "@/firebase/config";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

type WeekPlan = { week: number; topic: string; tasks: string[] };
type SubjectPlan = { subject_name: string; weekly_plan: WeekPlan[] };
type CompletedTasks = { [taskId: string]: boolean };

// ✅ --- Responsive and Sticky Navbar Component ---
const Navbar = ({ user, onLogout }: { user: User | null; onLogout: () => void; }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname(); // Hook to get the current URL

  const getLinkClass = (path: string) => {
    return pathname === path
      ? "bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium"
      : "text-gray-700 hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium";
  };

  return (
    // ✅ Added sticky, top-0, and z-50 to keep the navbar at the top
    <nav className="bg-white shadow-md w-full sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-600">
                🎓 StudyPlanner
              </span>
            </div>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <Link href="/dashboard" className={getLinkClass("/dashboard")}>
                  Home
              </Link>
              <Link href="#" className={getLinkClass("/features")}>
                  Features
              </Link>
              <Link href="#" className={getLinkClass("/about")}>
                  About
              </Link>
              {user && (
                <button onClick={onLogout} className="text-gray-700 hover:bg-red-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Logout
                </button>
              )}
            </div>
          </div>
          {/* Hamburger Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/dashboard" className={`${getLinkClass("/dashboard")} block`}>
                Home
            </Link>
            <Link href="#" className={`${getLinkClass("/features")} block`}>
                Features
            </Link>
            <Link href="#" className={`${getLinkClass("/about")} block`}>
                About
            </Link>
            {user && (
              <button onClick={onLogout} className="w-full text-left text-gray-700 hover:bg-red-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};


function PlanPageContent() {
  const router = useRouter();
  const [studyPlan, setStudyPlan] = useState<SubjectPlan[]>([]);
  const [syllabusText, setSyllabusText] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({});
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });

    const savedPlan = sessionStorage.getItem("studyPlanData");
    const savedText = sessionStorage.getItem("syllabusText");
    if (savedPlan && savedText) {
      setStudyPlan(JSON.parse(savedPlan));
      setSyllabusText(savedText);
    } else {
      router.push("/");
    }
    const savedProgress = localStorage.getItem("syllabusProgress");
    if (savedProgress) {
      setCompletedTasks(JSON.parse(savedProgress));
    }

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (Object.keys(completedTasks).length > 0) {
      localStorage.setItem("syllabusProgress", JSON.stringify(completedTasks));
    }
  }, [completedTasks]);

  const handleToggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleStartTest = (subjectName: string) => {
    sessionStorage.setItem("testSubject", subjectName);
    router.push(`/test/${encodeURIComponent(subjectName)}`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const totalTasks = studyPlan.reduce(
    (acc, subject) =>
      acc +
      (subject.weekly_plan?.reduce(
        (weekAcc, week) => weekAcc + (week.tasks?.length || 0),
        0
      ) || 0),
    0
  );
  const completedTasksCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  if (studyPlan.length === 0) {
    return <div className="text-center p-10">Loading study plan...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="w-full p-4 sm:p-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-lg border">
            <h2 className="text-3xl font-bold text-green-700 mb-2 text-center">
              🎉 Your Personalized Study Plan 🎉
            </h2>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-gray-700">
                  Overall Progress
                </span>
                <span className="text-sm font-bold text-green-600">
                  {progressPercentage}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-lime-400 to-green-500 h-2.5 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                {completedTasksCount} of {totalTasks} tasks completed
              </p>
            </div>

            <div className="space-y-10 border-t pt-6">
              {studyPlan.map((subject, subjectIndex) => (
                <div key={subjectIndex}>
                  <h3 className="text-2xl font-bold text-purple-800 mb-4 text-center">
                    {subject.subject_name}
                  </h3>
                  <div className="space-y-8">
                    {subject.weekly_plan.map((item) => (
                      <div key={item.week} className="border-l-4 border-lime-400 pl-6">
                        <div className="flex items-center mb-2">
                          <div className="bg-lime-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 shadow-md">
                            {item.week}
                          </div>
                          <h4 className="text-xl font-semibold text-blue-700">
                            {item.topic}
                          </h4>
                        </div>
                        <ul className="mt-2 text-gray-700 space-y-2">
                          {item.tasks.map((task, taskIndex) => {
                            const taskId = `subject-${subjectIndex}-week-${item.week}-task-${taskIndex}`;
                            return (
                              <li key={taskId} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={taskId}
                                  checked={!!completedTasks[taskId]}
                                  onChange={() => handleToggleTask(taskId)}
                                  className="w-4 h-4 text-green-600 rounded"
                                />
                                <label
                                  htmlFor={taskId}
                                  className={`ml-3 text-gray-800 font-medium ${
                                    completedTasks[taskId]
                                      ? "line-through text-gray-400"
                                      : ""
                                  }`}
                                >
                                  {task}
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => handleStartTest(subject.subject_name)}
                      className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-colors"
                    >
                      Take Final Test for {subject.subject_name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PlanPage() {
  return (
    <ProtectedRoute>
      <PlanPageContent />
    </ProtectedRoute>
  );
}
