"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase/config";
import { useRouter } from "next/navigation";

// 👁 Eye Icon Component
const EyeIcon = ({ closed }: { closed: boolean }) => {
  return closed ? (
    // Eye Closed
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
         viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 012.079-3.344M6.223 6.223A9.96 9.96 0 0112 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.478 0-8.268-2.943-9.543-7zM3 3l18 18" />
    </svg>
  ) : (
    // Eye Open
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
         viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.478 0-8.268-2.943-9.543-7z" />
    </svg>
  );
};

// 🔵 Google Logo
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M21.35 11.1h-9.18v2.92h5.51c-.24 1.41-1.66 4.14-5.51 4.14-3.32 0-6.03-2.74-6.03-6.12s2.71-6.12 6.03-6.12c1.89 0 3.16.8 3.88 1.49l2.65-2.56C17.35 3.4 15.01 2.3 12 2.3 6.73 2.3 2.5 6.59 2.5 11.96c0 5.37 4.23 9.66 9.5 9.66 5.48 0 9.11-3.85 9.11-9.28 0-.62-.07-1.09-.16-1.58z"
      fill="#4285F4"
    />
  </svg>
);

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 🔹 Email + Password Sign Up
  const handleEmailSignup = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/syllabusform"); // ✅ redirect after signup
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Google Sign In
  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/syllabusform"); // ✅ redirect after google login
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔹 Navbar */}
      <nav className="bg-white shadow-md fixed top-0 w-full z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-2xl font-bold text-indigo-600">
              🎓 StudyPlanner
            </a>
            <div className="flex items-center gap-6">
              <a href="/" className="text-gray-700 hover:text-indigo-600">
                Home
              </a>
              <a href="/login" className="text-gray-700 hover:text-indigo-600">
                Login
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 🔹 Page Content */}
      <div className="flex flex-col items-center justify-center px-6 pt-28">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2">Create an Account</h2>
          <p className="text-gray-600 text-center mb-6">
            Join StudyPlanner to start organizing your syllabus
          </p>

          {/* Email */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="mb-4 px-4 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="px-4 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              <EyeIcon closed={!showPassword} />
            </button>
          </div>

          {/* Error */}
          {errorMsg && (
            <p className="text-red-500 text-sm mb-4 text-center">{errorMsg}</p>
          )}

          {/* Sign Up Button */}
          <button
            onClick={handleEmailSignup}
            disabled={loading}
            className="w-full mb-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-2 w-full px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <GoogleIcon /> Sign up with Google
          </button>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-600 hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
