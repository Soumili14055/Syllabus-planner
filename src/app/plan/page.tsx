// File: src/app/plan/page.tsx

"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

// --- Types are the same ---
type WeekPlan = {
  week: number;
  topic: string;
  tasks: string[];
};

type SubjectPlan = {
  subject_name: string;
  weekly_plan: WeekPlan[];
};

type Questions = {
  five_mark_question: string;
  ten_mark_question: string;
};

// ✅ A type for our new questions state structure
type AllQuestions = {
  [topic: string]: Questions;
};

type CompletedTasks = {
  [taskId: string]: boolean;
};


export default function PlanPage() {
  const router = useRouter();
  const [studyPlan, setStudyPlan] = useState<SubjectPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ --- UPDATED QUESTIONS STATE ---
  // It's now an object to store questions per topic
  const [questions, setQuestions] = useState<AllQuestions>({});

  const [isQuestionsLoading, setIsQuestionsLoading] = useState<boolean>(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({});

  useEffect(() => {
    const savedPlan = sessionStorage.getItem('studyPlanData');
    if (savedPlan) {
      setStudyPlan(JSON.parse(savedPlan));
    } else {
      router.push('/');
    }

    const savedProgress = localStorage.getItem('syllabusProgress');
    if (savedProgress) {
      setCompletedTasks(JSON.parse(savedProgress));
    }
  }, [router]);

  useEffect(() => {
    if (Object.keys(completedTasks).length > 0) {
        localStorage.setItem('syllabusProgress', JSON.stringify(completedTasks));
    }
  }, [completedTasks]);

  const handleQuestionGeneration = async (topic: string) => {
    setIsQuestionsLoading(true);
    setActiveTopic(topic);
    setError(null);
    
    // ✅ Clear previous questions for this specific topic before fetching new ones
    setQuestions(prev => {
        const newQuestions = { ...prev };
        delete newQuestions[topic];
        return newQuestions;
    });

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch questions.");
      }
      
      // ✅ Add the new questions to our object of questions
      setQuestions(prev => ({
        ...prev,
        [topic]: data,
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Sorry, an error occurred while generating questions.");
    } finally {
      setIsQuestionsLoading(false);
      setActiveTopic(null);
    }
  };

  const handleToggleTask = (taskId: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const totalTasks = studyPlan.reduce((acc, subject) => acc + subject.weekly_plan.reduce((weekAcc, week) => weekAcc + week.tasks.length, 0), 0);
  const completedTasksCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  if (studyPlan.length === 0) {
    return <p className="text-center mt-10">Loading study plan...</p>
  }
  
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {error && <p className="text-red-600 text-center font-semibold bg-white/80 p-4 rounded-xl shadow-lg">{error}</p>}
            
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-200/80">
                <h2 className="text-3xl font-bold text-green-700 mb-2 text-center">🎉 Your Personalized Study Plan 🎉</h2>
                
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                        <span className="text-sm font-bold text-green-600">{progressPercentage}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-lime-400 to-green-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <p className="text-xs text-center text-gray-500 mt-2">{completedTasksCount} of {totalTasks} tasks completed</p>
                </div>
                
                <div className="space-y-10 border-t pt-6">
                {studyPlan.map((subject, subjectIndex) => (
                    <div key={subjectIndex}>
                    <h3 className="text-2xl font-bold text-purple-800 mb-4 text-center">{subject.subject_name}</h3>
                    <div className="space-y-8">
                        {subject.weekly_plan.map((item) => (
                        <div key={item.week} className="border-l-4 border-lime-400 pl-6">
                            <div className="flex items-center mb-2">
                            <div className="bg-lime-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 shadow-md">{item.week}</div>
                            <h4 className="text-xl font-semibold text-blue-700">{item.topic}</h4>
                            </div>
                            <ul className="mt-2 text-gray-700 space-y-2">
                            {item.tasks.map((task, taskIndex) => {
                                const taskId = `subject-${subjectIndex}-week-${item.week}-task-${taskIndex}`;
                                return (
                                <li key={taskId} className="flex items-center">
                                    <input type="checkbox" id={taskId} checked={!!completedTasks[taskId]} onChange={() => handleToggleTask(taskId)} className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"/>
                                    <label htmlFor={taskId} className={`ml-3 text-orange-600 font-medium ${completedTasks[taskId] ? 'line-through text-gray-400' : ''}`}>
                                    {task}
                                    </label>
                                </li>
                                );
                            })}
                            </ul>
                            <button onClick={() => handleQuestionGeneration(item.topic)} disabled={isQuestionsLoading && activeTopic === item.topic} className="mt-3 px-4 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-full hover:bg-indigo-600 transition-colors disabled:bg-indigo-300">
                                {isQuestionsLoading && activeTopic === item.topic ? 'Generating...' : 'Get Practice Questions'}
                            </button>

                            {/* ✅ --- QUESTION DISPLAY IS NOW HERE, INSIDE THE LOOP --- */}
                            {isQuestionsLoading && activeTopic === item.topic && <p className="text-center text-slate-600 font-semibold mt-4">Generating questions...</p>}
                            {questions[item.topic] && (
                                <div className="bg-indigo-50/50 p-4 rounded-lg mt-4 border border-indigo-200">
                                <h3 className="text-lg font-bold text-indigo-700 mb-4">Practice Questions</h3>
                                <div className="space-y-4">
                                    <div>
                                    <h4 className="font-semibold text-slate-800">[5 Marks]</h4>
                                    <p className="text-gray-700 mt-1">{questions[item.topic]!.five_mark_question}</p>
                                    </div>
                                    <div>
                                    <h4 className="font-semibold text-slate-800">[10 Marks]</h4>
                                    <p className="text-gray-700 mt-1">{questions[item.topic]!.ten_mark_question}</p>
                                    </div>
                                </div>
                                </div>
                            )}

                        </div>
                        ))}
                    </div>
                    </div>
                ))}
                </div>
            </div>
            
            {/* This section has been removed from the bottom */}
        </div>
    </main>
  );
}