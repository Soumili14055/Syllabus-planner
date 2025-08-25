"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams } from 'next/navigation';

type MCQ = { question: string; options: string[]; correct_answer: string; };
type WrittenQuestion = { question: string; marks: number; keywords: string[]; };
type TestData = { subject: string; total_marks: number; mcqs: MCQ[]; short_questions: WrittenQuestion[]; long_questions: WrittenQuestion[]; };
type UserAnswers = { mcqs: { [index: string]: string }; short_questions: { [index: string]: string }; long_questions: { [index: string]: string }; };
type GradingResult = { score: number; feedback: string; };
type AllGraded = { short_questions: GradingResult[]; long_questions: GradingResult[]; };

export default function ResultsPage() {
    const params = useParams();
    const subject = decodeURIComponent(params.subject as string);

    const [testData, setTestData] = useState<TestData | null>(null);
    const [userAnswers, setUserAnswers] = useState<UserAnswers | null>(null);
    const [gradedResults, setGradedResults] = useState<AllGraded | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndGrade = async () => {
            try {
                const resultsData = sessionStorage.getItem('testResults');
                if (!resultsData) { throw new Error("Could not find test results. Please take the test again."); }
                const { testData, userAnswers } = JSON.parse(resultsData);
                setTestData(testData);
                setUserAnswers(userAnswers);

                const gradingPromises: Promise<any>[] = [];
                testData.short_questions.forEach((q: WrittenQuestion, index: number) => {
                    const answer = userAnswers.short_questions[index] || "";
                    gradingPromises.push( fetch('/api/grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q.question, keywords: q.keywords, userAnswer: answer, marks: q.marks }), }).then(res => res.json()) );
                });
                testData.long_questions.forEach((q: WrittenQuestion, index: number) => {
                    const answer = userAnswers.long_questions[index] || "";
                    gradingPromises.push( fetch('/api/grade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q.question, keywords: q.keywords, userAnswer: answer, marks: q.marks }), }).then(res => res.json()) );
                });

                const gradedData = await Promise.all(gradingPromises);
                const shortQuestionsCount = testData.short_questions.length;
                const gradedShort = gradedData.slice(0, shortQuestionsCount);
                const gradedLong = gradedData.slice(shortQuestionsCount);
                setGradedResults({ short_questions: gradedShort, long_questions: gradedLong });

            } catch (err) { setError(err instanceof Error ? err.message : "An unknown error occurred.");
            } finally { setIsLoading(false); }
        };
        fetchAndGrade();
    }, []);

    const mcqScore = useMemo(() => {
        if (!testData || !userAnswers) return 0;
        
        let score = 0;
        testData.mcqs.forEach((mcq, index) => {
            const userAnswer = userAnswers.mcqs[index];
            // ✅ FIX: Compare the full trimmed text of both answers
            if (userAnswer && userAnswer.trim() === mcq.correct_answer.trim()) {
                score += 1; // 2 marks per question
            }
        });
        return score;
    }, [testData, userAnswers]);

    const writtenScore = useMemo(() => {
        if (!gradedResults) return 0;
        const shortScore = gradedResults.short_questions.reduce((sum, r) => sum + r.score, 0);
        const longScore = gradedResults.long_questions.reduce((sum, r) => sum + r.score, 0);
        return shortScore + longScore;
    }, [gradedResults]);

    const totalScore = mcqScore + writtenScore;

    if (isLoading) return <div className="text-center p-10 font-semibold text-lg">Grading your test, please wait...</div>;
    if (error) return <div className="text-center p-10 font-semibold text-red-600">{error}</div>;
    if (!testData || !userAnswers || !gradedResults) return <div className="text-center p-10">Could not load test results.</div>;

    return (
        <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl border">
                <h1 className="text-4xl font-bold text-center text-purple-700">Test Results: {subject}</h1>
                <div className="my-8 text-center bg-purple-100 border border-purple-300 p-6 rounded-lg">
                    <p className="text-lg text-purple-800">Your Final Score</p>
                    <p className="text-6xl font-bold text-purple-600">{totalScore} <span className="text-3xl text-gray-500">/ {testData.total_marks}</span></p>
                </div>
                <div className="space-y-12">
                    <section>
                        <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Multiple Choice Questions (Scored: {mcqScore}/10)</h2>
                        <div className="space-y-4">
                            {testData.mcqs.map((mcq, index) => {
                                const userAnswer = userAnswers.mcqs[index];
                                // ✅ FIX: Compare the full trimmed text for styling
                                const isCorrect = userAnswer ? userAnswer.trim() === mcq.correct_answer.trim() : false;
                                return (
                                    <div key={index} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'} border`}>
                                        <p className="font-semibold">{index + 1}. {mcq.question}</p>
                                        <p className="text-sm mt-2">Your answer: <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{userAnswer || "Not Answered"}</span></p>
                                        {!isCorrect && <p className="text-sm">Correct answer: <span className="font-bold text-green-700">{mcq.correct_answer}</span></p>}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                    {/* ... (Rest of your JSX remains the same) ... */}
                    <section><h2 className="text-2xl font-semibold border-b pb-2 mb-4">Short Answer Questions</h2><div className="space-y-6">{testData.short_questions.map((q, index) => ( <div key={index} className="p-4 rounded-lg bg-gray-50 border"><p className="font-semibold">{q.question} <span className="font-normal text-gray-500">({q.marks} Marks)</span></p><p className="text-sm mt-2 p-2 border bg-white rounded-md"><strong>Your Answer:</strong> {userAnswers.short_questions[index] || "Not Answered"}</p><div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md"><p className="font-bold text-blue-800">Score: {gradedResults.short_questions[index].score} / {q.marks}</p><p className="text-sm text-blue-700 mt-1"><strong>Feedback:</strong> {gradedResults.short_questions[index].feedback}</p></div></div>))}</div></section>
                    <section><h2 className="text-2xl font-semibold border-b pb-2 mb-4">Long Answer Questions</h2><div className="space-y-6">{testData.long_questions.map((q, index) => ( <div key={index} className="p-4 rounded-lg bg-gray-50 border"><p className="font-semibold">{q.question} <span className="font-normal text-gray-500">({q.marks} Marks)</span></p><p className="text-sm mt-2 p-2 border bg-white rounded-md"><strong>Your Answer:</strong> {userAnswers.long_questions[index] || "Not Answered"}</p><div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md"><p className="font-bold text-blue-800">Score: {gradedResults.long_questions[index].score} / {q.marks}</p><p className="text-sm text-blue-700 mt-1"><strong>Feedback:</strong> {gradedResults.long_questions[index].feedback}</p></div></div>))}</div></section>
                </div>
            </div>
        </main>
    );
}