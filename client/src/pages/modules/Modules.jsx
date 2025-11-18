import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { FiDatabase, FiArrowLeft } from "react-icons/fi";
import { GiMicroscope, GiDna2 } from "react-icons/gi";
import { GiTropicalFish } from "react-icons/gi";

const Modules = () => {
  const location = useLocation();
  const isNestedRoute = location.pathname !== "/app/modules";

  // If on nested route, show back button + Outlet
  if (isNestedRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            to="/app/modules"
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-gray-700 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-300"
          >
            <FiArrowLeft className="text-xl" />
            <span className="font-medium">Back to Modules</span>
          </Link>

          {/* Nested Route Content */}
          <Outlet />
        </div>
      </div>
    );
  }

  // Base route - show module cards
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
            Specialized Analysis Modules
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced tools for marine biodiversity research and data analysis
          </p>
        </div>

        {/* Module Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Otolith Analysis - Available */}
          <Link
            to="/app/modules/otolith-analysis"
            className="group bg-white rounded-2xl shadow-lg p-6 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <GiMicroscope className="text-3xl text-white" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Otolith Analysis
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-4 leading-relaxed">
              Upload otolith images to Cloudinary for cloud storage. Perform
              automated morphometric analysis and AI-powered species
              identification. Two-step process: upload first, then analyze.
            </p>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"
                role="status"
              >
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Available
              </span>
            </div>

            {/* Button */}
            <button
              className="mt-6 w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
              aria-label="Access Otolith Analysis Module"
            >
              Access Module
            </button>
          </Link>

          {/* Card 2: Taxonomic Management - Available */}
          <Link
            to="/app/modules/taxonomic-management"
            className="group bg-white rounded-2xl shadow-lg p-6 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <GiTropicalFish className="text-3xl text-white" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Taxonomic Management
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-4 leading-relaxed">
              Upload fish species images for AI-powered identification using iNaturalist. 
              Get comprehensive species information with confidence scores. Export detailed 
              analysis reports as PDF.
            </p>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"
                role="status"
              >
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Available
              </span>
            </div>

            {/* Button */}
            <button
              className="mt-6 w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-800 transition-all duration-300 shadow-md hover:shadow-lg"
              aria-label="Access Taxonomic Management Module"
            >
              Access Module
            </button>
          </Link>

          {/* Card 3: eDNA Processing */}
          <Link
            to="/app/modules/edna-processing"
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 p-6 block"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <GiDna2 className="text-3xl text-white" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
              eDNA Processing
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-4 leading-relaxed">
              Process environmental DNA samples to detect marine species
              presence. Analyze sequencing data and generate biodiversity
              reports from water samples.
            </p>

            {/* Features List */}
            <ul className="space-y-2 mb-4">
              <li className="flex items-center text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span>
                Upload sequence files (FASTA, CSV)
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span>
                Metabarcoding analysis
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span>
                Biodiversity metrics calculation
              </li>
            </ul>

            {/* Button */}
            <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
              Launch Module
              <svg
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </Link>
        </div>

        {/* Info Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            More specialized modules are under development. Check back soon for
            updates!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Modules;