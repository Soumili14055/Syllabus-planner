// File: src/app/quick-results/[subject]/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase/config";

// --- (Type Definitions - No Changes) ---
type MCQ = { question: string; options: string[]; correct_answer: string; };
type WrittenQuestion = { question: string; marks: number; keywords: string[]; };
type TestData = { subject: string; total_marks: number; test_type?: 'MCQ' | 'SAQ'; mcqs?: MCQ[]; short_questions?: WrittenQuestion[]; };
type UserAnswers = { mcqs?: { [index: string]: string }; short_questions?: { [index: string]: string }; };
type GradingResult = { score: number; feedback: string; };
type AllGraded = { short_questions: GradingResult[]; };

export default function QuickResultsPage() {
    const params = useParams();
    const router = useRouter();
    const subject = decodeURIComponent(params.subject as string);

    const [testData, setTestData] = useState<TestData | null>(null);
    const [userAnswers, setUserAnswers] = useState<UserAnswers | null>(null);
    const [gradedResults, setGradedResults] = useState<AllGraded | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndGrade = async () => {
            try {
                const savedTestData = sessionStorage.getItem('testData');
                const savedUserAnswers = sessionStorage.getItem('userAnswers');

                if (!savedTestData || !savedUserAnswers) {
                    throw new Error("Could not find test results.");
                }
                
                const testDataJSON: TestData = JSON.parse(savedTestData);
                const userAnswersJSON: UserAnswers = JSON.parse(savedUserAnswers);
                setTestData(testDataJSON);
                setUserAnswers(userAnswersJSON);

                if (testDataJSON.test_type === 'SAQ' && testDataJSON.short_questions) {
                    const gradingPromises = testDataJSON.short_questions.map((q, index) => {
                        const answer = userAnswersJSON.short_questions?.[index] || "";
                        return fetch('/api/grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q.question, keywords: q.keywords, userAnswer: answer, marks: q.marks }) }).then(res => res.json());
                    });
                    const gradedData = await Promise.all(gradingPromises);
                    setGradedResults({ short_questions: gradedData });
                } else {
                    setGradedResults({ short_questions: [] });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred.");
            } finally {
                setIsLoading(false);
            }
        };
        onAuthStateChanged(auth, (user) => user ? fetchAndGrade() : router.push('/login'));
    }, [router]);
    
    const finalScore = useMemo(() => {
        if (!testData || !userAnswers) return 0;
        if (testData.test_type === 'MCQ' && testData.mcqs) {
            return testData.mcqs.reduce((acc, mcq, index) => {
                const userAnswer = userAnswers.mcqs?.[index];
                return userAnswer && userAnswer.trim() === mcq.correct_answer.trim() ? acc + 1 : acc;
            }, 0);
        }
        if (testData.test_type === 'SAQ' && gradedResults) {
            return gradedResults.short_questions.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
        }
        return 0;
    }, [testData, userAnswers, gradedResults]);

    // ✅ FIX: This effect runs after grading is complete to save the final score.
    useEffect(() => {
        if (!isLoading && testData) {
            const newResult = {
                id: Date.now(),
                subject: `${testData.subject} (${testData.test_type})`,
                score: finalScore, // Use the calculated final score
                totalMarks: testData.total_marks,
                date: new Date().toISOString().split('T')[0]
            };
            sessionStorage.setItem('newTestResult', JSON.stringify(newResult));
        }
    }, [isLoading, finalScore, testData]);

    if (isLoading) return <div className="text-center p-10 font-semibold text-lg">Analyzing your results...</div>;
    if (error) return <div className="text-center p-10 font-semibold text-red-600">{error}</div>;
    if (!testData || !userAnswers || !gradedResults) return <div className="text-center p-10">Could not load results.</div>;

    return (
        <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-xl shadow-2xl border">
                    <h1 className="text-4xl font-bold text-center text-purple-700">Test Results: {subject}</h1>
                    <div className="my-8 text-center bg-purple-100 border p-6 rounded-lg">
                        <p className="text-lg text-purple-800">Your Final Score</p>
                        <p className="text-6xl font-bold text-purple-600">{finalScore} <span className="text-3xl text-gray-500">/ {testData.total_marks}</span></p>
                    </div>
                    
                    {testData.test_type === 'MCQ' && testData.mcqs?.map((mcq, index) => {
                        const userAnswer = userAnswers.mcqs?.[index];
                        const isCorrect = userAnswer ? userAnswer.trim() === mcq.correct_answer.trim() : false;
                        return (
                            <div key={index} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'} border mb-4`}>
                                <p className="font-semibold">{index + 1}. {mcq.question}</p>
                                <p className="text-sm mt-2">Your answer: <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || "Not Answered"}</span></p>
                                {!isCorrect && <p className="text-sm">Correct answer: <span className="font-bold text-green-700">{mcq.correct_answer}</span></p>}
                            </div>
                        );
                    })}

                    {testData.test_type === 'SAQ' && testData.short_questions?.map((q, index) => (
                         <div key={index} className="p-4 rounded-lg bg-gray-50 border mb-6">
                            <p className="font-semibold">{q.question} <span className="font-normal text-gray-500">({q.marks} Marks)</span></p>
                            <p className="text-sm mt-2 p-2 border bg-white rounded-md"><strong>Your Answer:</strong> {userAnswers.short_questions?.[index] || "Not Answered"}</p>
                            <div className="mt-2 p-3 bg-blue-50 border rounded-md">
                                <p className="font-bold text-blue-800">Score: {gradedResults.short_questions[index]?.score ?? 'N/A'} / {q.marks}</p>
                                <p className="text-sm text-blue-700 mt-1"><strong>Feedback:</strong> {gradedResults.short_questions[index]?.feedback ?? 'Grading...'}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-6">
                    <Link href="/dashboard" className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </main>
    );
}
