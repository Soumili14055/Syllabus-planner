// File: src/app/test/[subject]/page.tsx

"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';

// --- Types ---
type MCQ = { question: string; options: string[]; correct_answer: string; };
type WrittenQuestion = { question: string; marks: number; keywords: string[]; };
type TestData = {
  subject: string;
  total_marks: number;
  duration_hours?: number; // Make duration optional
  mcqs: MCQ[];
  short_questions: WrittenQuestion[];
  long_questions: WrittenQuestion[];
};
type UserAnswers = {
    mcqs: { [index: number]: string };
    short_questions: { [index: number]: string };
    long_questions: { [index: number]: string };
};

export default function TestPage() {
    const router = useRouter();
    const params = useParams();
    const subject = decodeURIComponent(params.subject as string);

    const [testData, setTestData] = useState<TestData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({ mcqs: {}, short_questions: {}, long_questions: {} });

    useEffect(() => {
        const syllabusText = sessionStorage.getItem('syllabusText');
        const testSubject = sessionStorage.getItem('testSubject');

        if (!syllabusText || !testSubject || testSubject !== subject) {
            setError("Could not load test data. Please go back and start the test again.");
            setIsLoading(false);
            return;
        }

        const fetchTest = async () => {
            try {
                const response = await fetch('/api/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subject, syllabusText }),
                });
                const data = await response.json();
                if (!response.ok) { throw new Error(data.error || "Failed to fetch the test paper."); }
                setTestData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTest();
    }, [subject]);

    const handleAnswerChange = (type: keyof UserAnswers, index: number, value: string) => {
        setUserAnswers(prev => ({ ...prev, [type]: { ...prev[type], [index]: value } }));
    };

    const handleSubmitTest = () => {
        sessionStorage.setItem('testResults', JSON.stringify({ testData, userAnswers }));
        router.push(`/results/${encodeURIComponent(subject)}`);
    };

    if (isLoading) return <div className="text-center p-10 font-semibold text-lg">Generating your test, please wait...</div>;
    if (error) return <div className="text-center p-10 font-semibold text-red-600">{error}</div>;
    if (!testData) return <div className="text-center p-10">No test data found.</div>;

    // ✅ CALCULATE TOTAL MARKS FOR EACH SECTION DYNAMICALLY
    const mcqTotalMarks = testData.mcqs?.length || 0;
    const shortQuestionsTotalMarks = testData.short_questions?.reduce((sum, q) => sum + q.marks, 0) || 0;
    const longQuestionsTotalMarks = testData.long_questions?.reduce((sum, q) => sum + q.marks, 0) || 0;

    return (
        <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl border">
                {/* Header */}
                <div className="py-4 mb-8 border-b-2 border-indigo-500">
                    <h1 className="text-4xl font-bold text-center text-indigo-700">{testData.subject} Quiz</h1>
                    <p className="text-center text-gray-600 mt-1">{testData.total_marks} Marks</p>
                </div>

                <div className="space-y-12">
                    {/* MCQs Section */}
                    <section>
                        {/* ✅ DYNAMIC HEADING */}
                        <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Multiple Choice Questions ({mcqTotalMarks} Marks)</h2>
                        <div className="space-y-6">
                            {testData.mcqs && testData.mcqs.map((mcq, index) => (
                                <div key={index}>
                                    <p className="font-semibold">{index + 1}. {mcq.question}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 pl-4">
                                        {mcq.options.map((option) => (
                                            <label key={option} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                                <input type="radio" name={`mcq-${index}`} value={option} onChange={(e) => handleAnswerChange('mcqs', index, e.target.value)} className="form-radio text-indigo-600"/>
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Short Questions Section */}
                    <section>
                        {/* ✅ DYNAMIC HEADING */}
                        <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Short Answer Questions ({shortQuestionsTotalMarks} Marks)</h2>
                        <div className="space-y-6">
                            {testData.short_questions && testData.short_questions.map((q, index) => (
                                <div key={index}>
                                    <p className="font-semibold">{index + 1}. {q.question} <span className="font-normal text-gray-500">({q.marks} Marks)</span></p>
                                    <textarea rows={4} className="w-full mt-2 p-2 border border-gray-300 rounded-md" placeholder="Type your answer here..." onChange={(e) => handleAnswerChange('short_questions', index, e.target.value)} />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Long Questions Section */}
                    <section>
                        {/* ✅ DYNAMIC HEADING */}
                        <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Long Answer Questions ({longQuestionsTotalMarks} Marks)</h2>
                        <div className="space-y-6">
                            {testData.long_questions && testData.long_questions.map((q, index) => (
                                <div key={index}>
                                    <p className="font-semibold">{index + 1}. {q.question} <span className="font-normal text-gray-500">({q.marks} Marks)</span></p>
                                    <textarea rows={8} className="w-full mt-2 p-2 border border-gray-300 rounded-md" placeholder="Type your answer here..." onChange={(e) => handleAnswerChange('long_questions', index, e.target.value)} />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Submit Button */}
                    <div className="text-center pt-8 border-t">
                        <button onClick={handleSubmitTest} className="px-8 py-3 bg-green-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-green-700">
                            Submit Test
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}