"use client"
import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-20 h-20 bg-slate-900 border border-slate-800 text-slate-400 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
        <FileQuestion className="w-10 h-10 text-purple-400" />
      </div>

      <div className="space-y-2 mb-8">
        <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/80 border border-purple-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
          404 Error
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mt-3">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          The page you are looking for does not exist, has been removed, or is currently unavailable.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-purple-500/20 transition-all flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
