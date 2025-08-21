// File: src/app/page.tsx

import SyllabusForm from "@/components/SyllabusForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 md:p-24 bg-slate-50">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-4">
          AI Syllabus Planner
        </h1>
        <p className="text-slate-600 mb-8">
          Upload your course syllabus and select a deadline to instantly generate a personalized study schedule.
        </p>
      </div>
      <SyllabusForm />
    </main>
  );
}