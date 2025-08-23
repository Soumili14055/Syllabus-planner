// File: src/app/page.tsx
import SyllabusForm from "@/components/SyllabusForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center text-slate-800 mb-6">
          AI Syllabus Planner 🚀
        </h1>
        <SyllabusForm />
      </div>
    </main>
  );
}