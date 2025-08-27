// File: src/app/quick-test/[...params]/page.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/firebase/config';

// --- (Responsive Navbar Component - No changes needed) ---
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
                    <div className="flex-shrink-0"><span className="text-2xl font-bold text-indigo-600">🎓 StudyPlanner</span></div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6 space-x-4">
                            <Link href="/dashboard" className={getLinkClass("/dashboard")}>Home</Link>
                            <Link href="/syllabus" className={getLinkClass("/syllabus")}>Syllabus Planner</Link>
                            {user && <button onClick={onLogout} className="text-gray-700 hover:bg-red-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Logout</button>}
                        </div>
                    </div>
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-gray-400 hover:bg-indigo-500 focus:outline-none">
                            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">{isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}</svg>
                        </button>
                    </div>
                </div>
            </div>
            {isOpen && (
                <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <Link href="/dashboard" className={`${getLinkClass("/dashboard")} block`}>Home</Link>
                    <Link href="/syllabus" className={`${getLinkClass("/syllabus")} block`}>Syllabus Planner</Link>
                    {user && <button onClick={onLogout} className="w-full text-left text-gray-700 hover:bg-red-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Logout</button>}
                </div>
            )}
        </nav>
    );
};

// --- Timer Component ---
const Timer = ({ initialMinutes, onTimeUp }: { initialMinutes: number; onTimeUp: () => void; }) => {
    const [seconds, setSeconds] = useState(initialMinutes * 60);
    useEffect(() => {
        if (seconds <= 0) { onTimeUp(); return; }
        const interval = setInterval(() => setSeconds(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [seconds, onTimeUp]);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return <div className={`text-2xl font-bold ${seconds < 60 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>Time Left: {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</div>;
};

// --- Main Test Page Component ---
export default function QuickTestPage() {
    const router = useRouter();
    const params = useParams();
    const [testType, topic] = Array.isArray(params.params) ? params.params.map(decodeURIComponent) : [];

    const [user, setUser] = useState<User | null>(null);
    const [testData, setTestData] = useState<any>(null);
    const [userAnswers, setUserAnswers] = useState<{ mcqs: { [key: number]: string }, short_questions: { [key: number]: string } }>({ mcqs: {}, short_questions: {} });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) router.push("/login");
            else setUser(currentUser);
        });

        const generateTest = async () => {
            if (!topic || !testType) {
                setError("Missing test parameters.");
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch('/api/quick-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic, testType }),
                });
                if (!response.ok) throw new Error("Failed to generate test.");
                const data = await response.json();
                setTestData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred.");
            } finally {
                setIsLoading(false);
            }
        };
        generateTest();
        return () => unsubscribe();
    }, [topic, testType, router]);
    
    const handleAnswerChange = (type: 'mcqs' | 'short_questions', index: number, value: string) => {
        setUserAnswers(prev => ({ ...prev, [type]: { ...prev[type], [index]: value } }));
    };

const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    sessionStorage.setItem('testData', JSON.stringify(testData));
    sessionStorage.setItem('userAnswers', JSON.stringify(userAnswers));
    
    let score = 0; // The score always starts at 0.

    if (testData.test_type === 'MCQ') {
        // This part calculates the score for MCQs
        score = testData.mcqs.reduce((acc: number, mcq: any, index: number) => {
            
            // It checks if your answer is correct
            const isCorrect = userAnswers.mcqs[index] && userAnswers.mcqs[index].trim() === mcq.correct_answer.trim();

            // If the answer is correct, it adds 1 point to the accumulator (acc).
            // If the answer is wrong or unanswered, it adds 0 points.
            // It never subtracts points.
            return isCorrect ? acc + 1 : acc;

        }, 0); // The calculation starts from an initial score of 0.
    } else {
        score = -1; // Placeholder for SAQs
    }
    
    const newResult = {
        id: Date.now(), subject: `${topic} (${testType})`,
        score: score, totalMarks: testData.total_marks,
        date: new Date().toISOString().split('T')[0]
    };
    sessionStorage.setItem('newTestResult', JSON.stringify(newResult));

    router.push(`/quick-results/${encodeURIComponent(topic)}`);
};


    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (isLoading) return <div className="text-center p-10">🚀 Generating your quick test...</div>;
    if (error) return <div className="text-center p-10 text-red-600">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar user={user} onLogout={handleLogout} />
            <main className="max-w-4xl mx-auto py-8 px-4">
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Quick Test: {testData?.subject}</h1>
                    {testData?.time_limit_minutes && <Timer initialMinutes={testData.time_limit_minutes} onTimeUp={() => handleSubmit()} />}
                </div>

                <form onSubmit={handleSubmit}>
                    {testData?.test_type === 'MCQ' && (
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">Multiple Choice Questions</h2>
                            {testData.mcqs.map((mcq: any, index: number) => (
                                <div key={index} className="bg-white p-4 rounded-lg shadow-sm mb-4">
                                    <p className="font-semibold mb-2">{index + 1}. {mcq.question}</p>
                                    <div className="space-y-2">
                                        {mcq.options.map((option: string, optIndex: number) => (
                                            <label key={optIndex} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                                                <input type="radio" name={`mcq-${index}`} value={option} onChange={(e) => handleAnswerChange('mcqs', index, e.target.value)} className="mr-2"/>
                                                {option}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {testData?.test_type === 'SAQ' && (
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">Short Answer Questions</h2>
                            {testData.short_questions.map((q: any, index: number) => (
                                <div key={index} className="bg-white p-4 rounded-lg shadow-sm mb-4">
                                    <p className="font-semibold mb-2">{index + 1}. {q.question} ({q.marks} marks)</p>
                                    <textarea onChange={(e) => handleAnswerChange('short_questions', index, e.target.value)} className="w-full p-2 border rounded-md" rows={5}></textarea>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <button type="submit" disabled={isSubmitting} className="w-full mt-6 py-3 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                        {isSubmitting ? 'Submitting...' : 'Submit Test'}
                    </button>
                </form>
            </main>
        </div>
    );
}
