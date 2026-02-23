import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-8 py-4 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-blue-600">Care line 360</h1>

        <div className="space-x-4">
          <Link
            className="px-5 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
            to="/login"
          >
            Login
          </Link>
          <Link
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            to="/register"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Welcome to <span className="text-blue-600">Care line 360</span>
          </h2>

          <p className="text-gray-600 text-lg mb-8">
            A smart healthcare platform to manage patient records, connect with
            doctors, and monitor medical insights all in one place.
          </p>

          <div className="flex justify-center gap-6">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-xl text-lg hover:bg-blue-700 transition">
              Get Started
            </button>

            <button className="px-8 py-3 border border-blue-600 text-blue-600 rounded-xl text-lg hover:bg-blue-50 transition">
              Learn More
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500">
        © {new Date().getFullYear()} Care line 360. All rights reserved.
      </footer>
    </div>
  );
}
