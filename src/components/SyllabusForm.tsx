// File: src/components/SyllabusForm.tsx

"use client";
import { useState, FormEvent, useEffect } from "react";

// ✅ --- UPDATED TYPES TO HANDLE MULTIPLE SUBJECTS ---
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

type CompletedTasks = {
  [taskId: string]: boolean;
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
  const [studyPlan, setStudyPlan] = useState<SubjectPlan[]>([]); // ✅ Updated state type
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Questions | null>(null);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState<boolean>(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>({});

  useEffect(() => {
    const savedProgress = localStorage.getItem('syllabusProgress');
    if (savedProgress) {
      setCompletedTasks(JSON.parse(savedProgress));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('syllabusProgress', JSON.stringify(completedTasks));
  }, [completedTasks]);


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
    setQuestions(null);
    setCompletedTasks({});

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

  const handleQuestionGeneration = async (topic: string) => {
    setIsQuestionsLoading(true);
    setQuestions(null);
    setActiveTopic(topic);
    setError(null);
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
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sorry, an error occurred while generating questions.");
    } finally {
      setIsQuestionsLoading(false);
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-8 border border-gray-200/80">
        {/* Form is the same */}
        <div className="mb-6 border-b border-gray-300/80 pb-4">
          <label htmlFor="syllabusFile" className="block text-indigo-700 font-semibold text-lg mb-2">
            1. Upload Syllabus <span className="text-sm text-gray-500">(PDF)</span>
          </label>
          <label htmlFor="syllabusFile" className="w-full text-sm text-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer bg-indigo-50/80 rounded-full text-center p-3 border border-dashed border-indigo-300 block">
            <input type="file" id="syllabusFile" accept=".pdf" onChange={handleFileChange} className="hidden" />
            <span>{fileName || "Click to select a file"}</span>
          </label>
        </div>
        <div className="mb-6 border-b border-gray-300/80 pb-4">
          <label htmlFor="endDate" className="block text-purple-700 font-semibold text-lg mb-2">
            2. Select Completion Date
          </label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full p-3 bg-white/80 border border-purple-300 rounded-md text-purple-600 form-input-interactive" />
        </div>
        <button type="submit" disabled={isLoading || !syllabusFile || !endDate} className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-md disabled:bg-slate-400 disabled:cursor-not-allowed btn-interactive">
          {isLoading ? <><Spinner /> Generating Plan...</> : "✨ Generate Study Plan ✨"}
        </button>
      </form>

      <div className="space-y-6">
        {error && <p className="text-red-600 text-center font-semibold bg-white/80 p-4 rounded-xl shadow-lg">{error}</p>}
        
        {studyPlan.length > 0 && (
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
            
            {/* ✅ --- UPDATED DISPLAY LOGIC FOR MULTIPLE SUBJECTS --- */}
            <div className="space-y-10 border-t pt-6">
              {studyPlan.map((subject, subjectIndex) => (
                <div key={subjectIndex}>
                  <h3 className="text-2xl font-bold text-purple-800 mb-4 text-center">{subject.subject_name}</h3>
                  <div className="space-y-8">
                    {subject.weekly_plan.map((item) => (
                      <div key={item.week} className="border-l-4 border-lime-400 pl-6 study-plan-item">
                        <div className="flex items-center mb-2">
                          <div className="bg-lime-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 shadow-md">{item.week}</div>
                          <h4 className="text-xl font-semibold text-blue-700">{item.topic}</h4>
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
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                />
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
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
        
        {isQuestionsLoading && <p className="text-center text-slate-600 font-semibold">Generating questions for "{activeTopic}"...</p>}
        {questions && (
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-200/80 mt-6">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6 text-center">Practice Questions for "{activeTopic}"</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">[5 Marks]</h3>
                <p className="text-gray-700 mt-2">{questions.five_mark_question}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">[10 Marks]</h3>
                <p className="text-gray-700 mt-2">{questions.ten_mark_question}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}