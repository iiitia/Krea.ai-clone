'use client';

import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import { ArrowRight, Workflow, Zap, Shield } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Workflow className="w-8 h-8 text-purple-500" />
              <span className="text-xl font-bold text-white">NextFlow</span>
            </div>
            <div className="flex items-center gap-4">
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="text-gray-300 hover:text-white transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              ) : (
                <>
                  <Link
                    href="/builder"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Builder
                  </Link>
                  <UserButton />
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Build AI Workflows
            <span className="text-purple-500"> Visually</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Create powerful AI workflows with a visual builder. Connect nodes,
            process images and videos, and leverage Google Gemini for intelligent
            automation.
          </p>
          <div className="flex items-center justify-center gap-4">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                  Get Started
                  <ArrowRight size={20} />
                </button>
              </SignInButton>
            ) : (
              <Link
                href="/builder"
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Open Builder
                <ArrowRight size={20} />
              </Link>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
            <Workflow className="w-10 h-10 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Visual Builder
            </h3>
            <p className="text-gray-400">
              Drag and drop nodes to create complex workflows. Connect components
              with intuitive visual edges.
            </p>
          </div>
          <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
            <Zap className="w-10 h-10 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">AI Powered</h3>
            <p className="text-gray-400">
              Leverage Google Gemini for intelligent text processing and image
              understanding in your workflows.
            </p>
          </div>
          <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
            <Shield className="w-10 h-10 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Secure & Private
            </h3>
            <p className="text-gray-400">
              Your workflows and data are secure. Built with Clerk authentication
              and isolated execution environments.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
