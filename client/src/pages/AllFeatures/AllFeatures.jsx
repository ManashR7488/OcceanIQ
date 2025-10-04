import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import OceanWavePattern from '../../components/OceanWavePattern';
import MarineIcon from '../../components/MarineIcon';

const AllFeatures = () => {
  const navigate = useNavigate();
  const observerRef = useRef(null);

  useEffect(() => {
    // Intersection Observer for fade-in animations on scroll
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeInUp');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all elements with data-animate attribute
    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 overflow-hidden">
        <OceanWavePattern variant="animated" opacity={0.15} color="cyan" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6" data-animate>
            <MarineIcon type="submarine" size={64} color="#0891B2" animated />
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-6" data-animate>
            Platform Features
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-4 max-w-4xl mx-auto" data-animate>
            Comprehensive Marine Data Platform Capabilities
          </p>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto" data-animate>
            Explore our cutting-edge tools for oceanographic data integration, AI-powered analytics, 
            molecular biodiversity analysis, and advanced research workflows.
          </p>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-4">
              Core Capabilities
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Six powerful modules designed to revolutionize marine research and data analysis
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Unified Data Integration */}
            <div
              data-animate
              className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl mb-6">
                <MarineIcon type="compass" size={32} color="white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Unified Data Integration
              </h3>
              <p className="text-gray-600 mb-4">
                Consolidate data from multiple sources into a single, harmonized platform for seamless analysis and collaboration.
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold text-gray-700">Supported Formats:</p>
                <div className="flex flex-wrap gap-2">
                  {['CSV', 'JSON', 'netCDF', 'Excel', 'XML'].map((format) => (
                    <span key={format} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-cyan-600">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
              <button className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm flex items-center gap-2 transition">
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Feature 2: Automated Data Processing */}
            <div
              data-animate
              className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl mb-6">
                <MarineIcon type="anchor" size={32} color="white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Automated Data Processing
              </h3>
              <p className="text-gray-600 mb-4">
                Intelligent automation for data ingestion, validation, standardization, and quality control workflows.
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold text-gray-700">Standards Compliance:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• CF-compliant netCDF</li>
                  <li>• BODC vocabularies</li>
                  <li>• ISO 19115 metadata</li>
                  <li>• MIxS standards</li>
                </ul>
              </div>
              <button className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm flex items-center gap-2 transition">
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Feature 3: AI-Powered Analytics */}
            <div
              data-animate
              className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl mb-6">
                <MarineIcon type="fish" size={32} color="white" animated />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                AI-Powered Analytics
              </h3>
              <p className="text-gray-600 mb-4">
                Advanced machine learning models for cross-disciplinary correlation analysis, predictive modeling, and intelligent insights.
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold text-gray-700">Capabilities:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Pattern recognition</li>
                  <li>• Predictive modeling</li>
                  <li>• Anomaly detection</li>
                  <li>• Correlation analysis</li>
                </ul>
              </div>
              <button className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm flex items-center gap-2 transition">
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Feature 4: Otolith Analysis Module */}
            <div
              data-animate
              className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-xl mb-6">
                <MarineIcon type="shell" size={32} color="white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Otolith Analysis Module
              </h3>
              <p className="text-gray-600 mb-4">
                Comprehensive tools for otolith shape visualization, morphometric analysis, and AI-driven species classification.
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold text-gray-700">Features:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 2D/3D visualization</li>
                  <li>• Shape descriptors</li>
                  <li>• Species matching</li>
                  <li>• Morphometric analysis</li>
                </ul>
              </div>
              <button className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm flex items-center gap-2 transition">
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Feature 5: Taxonomic Management */}
            <div
              data-animate
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl mb-6">
                <MarineIcon type="coral" size={32} color="white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Taxonomic Management
              </h3>
              <p className="text-gray-600 mb-4">
                Integrated WoRMS database access, hierarchical classification, and AI-powered species identification tools.
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold text-gray-700">Integrations:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• WoRMS API integration</li>
                  <li>• Taxonomic tree visualization</li>
                  <li>• Species search</li>
                  <li>• AI identification</li>
                </ul>
              </div>
              <button className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm flex items-center gap-2 transition">
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Feature 6: Molecular & eDNA Processing */}
            <div
              data-animate
              className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl mb-6">
                <MarineIcon type="whale" size={32} color="white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Molecular & eDNA Processing
              </h3>
              <p className="text-gray-600 mb-4">
                Advanced eDNA analysis, DNA barcode matching, metabarcoding workflows, and biodiversity assessment tools.
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold text-gray-700">Databases:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• BOLD Systems</li>
                  <li>• GenBank integration</li>
                  <li>• Barcode matching</li>
                  <li>• Metabarcoding analysis</li>
                </ul>
              </div>
              <button className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm flex items-center gap-2 transition">
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Otolith Analysis Deep Dive */}
      <section className="relative py-20 bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 overflow-hidden">
        <OceanWavePattern variant="background" opacity={0.1} color="blue" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div data-animate>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                  <MarineIcon type="shell" size={24} color="white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Otolith Analysis
                </h2>
              </div>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                Advanced tools for comprehensive otolith shape analysis, enabling precise species identification 
                and age determination through cutting-edge image processing and machine learning.
              </p>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Key Capabilities:</h3>
                {[
                  { title: '2D/3D Visualization', desc: 'Interactive rendering of otolith structures' },
                  { title: 'Fourier Analysis', desc: 'Advanced shape descriptor extraction' },
                  { title: 'Shape Descriptors', desc: 'Morphometric measurements and ratios' },
                  { title: 'Species Matching', desc: 'AI-powered classification algorithms' },
                  { title: 'Comparison Tools', desc: 'Side-by-side otolith comparison' }
                ].map((capability, index) => (
                  <div key={index} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-md">
                    <svg
                      className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-800">{capability.title}</h4>
                      <p className="text-sm text-gray-600">{capability.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right - Decorative Icons */}
            <div className="relative h-96 lg:h-full min-h-[400px]" data-animate>
              <div className="absolute top-0 right-0 opacity-20">
                <MarineIcon type="shell" size={150} color="#0891B2" />
              </div>
              <div className="absolute top-1/3 left-0 opacity-15">
                <MarineIcon type="fish" size={120} color="#2563EB" animated />
              </div>
              <div className="absolute bottom-0 right-1/4 opacity-20">
                <MarineIcon type="compass" size={100} color="#0D9488" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Taxonomic Management Deep Dive */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Decorative Icons */}
            <div className="relative h-96 lg:h-full min-h-[400px] order-2 lg:order-1" data-animate>
              <div className="absolute top-0 left-0 opacity-20">
                <MarineIcon type="coral" size={150} color="#0891B2" />
              </div>
              <div className="absolute top-1/3 right-0 opacity-15">
                <MarineIcon type="whale" size={130} color="#2563EB" />
              </div>
              <div className="absolute bottom-0 left-1/4 opacity-20">
                <MarineIcon type="anchor" size={90} color="#0D9488" />
              </div>
            </div>
            
            {/* Right - Content */}
            <div className="order-1 lg:order-2" data-animate>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <MarineIcon type="coral" size={24} color="white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Taxonomic Management
                </h2>
              </div>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                Seamlessly integrate with global taxonomic databases and leverage AI-powered tools for 
                accurate species identification and comprehensive taxonomic classification.
              </p>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Key Capabilities:</h3>
                {[
                  { title: 'WoRMS API Integration', desc: 'Direct access to World Register of Marine Species' },
                  { title: 'Hierarchical Classification', desc: 'Complete taxonomic tree navigation' },
                  { title: 'Species Search', desc: 'Advanced search with filters and synonyms' },
                  { title: 'Taxonomic Tree', desc: 'Visual representation of relationships' },
                  { title: 'AI Identification', desc: 'Machine learning-based species recognition' }
                ].map((capability, index) => (
                  <div key={index} className="flex items-start gap-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-4 shadow-md">
                    <svg
                      className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-800">{capability.title}</h4>
                      <p className="text-sm text-gray-600">{capability.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* eDNA Processing Deep Dive */}
      <section className="relative py-20 bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 overflow-hidden">
        <OceanWavePattern variant="background" opacity={0.1} color="teal" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div data-animate>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg">
                  <MarineIcon type="whale" size={24} color="white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                  eDNA Processing
                </h2>
              </div>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                Revolutionary environmental DNA analysis tools for biodiversity assessment, species detection, 
                and ecosystem monitoring through advanced metabarcoding workflows.
              </p>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Key Capabilities:</h3>
                {[
                  { title: 'Sequence Upload', desc: 'Support for FASTA, FASTQ, and other formats' },
                  { title: 'Barcode Comparison', desc: 'Match against BOLD and GenBank databases' },
                  { title: 'Metabarcoding Analysis', desc: 'Complete pipeline from raw data to results' },
                  { title: 'Biodiversity Assessment', desc: 'Species richness and composition analysis' },
                  { title: 'Species Detection', desc: 'Sensitive detection of rare species' }
                ].map((capability, index) => (
                  <div key={index} className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-md">
                    <svg
                      className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-800">{capability.title}</h4>
                      <p className="text-sm text-gray-600">{capability.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right - Decorative Icons */}
            <div className="relative h-96 lg:h-full min-h-[400px]" data-animate>
              <div className="absolute top-0 right-0 opacity-20">
                <MarineIcon type="submarine" size={140} color="#0891B2" />
              </div>
              <div className="absolute top-1/3 left-0 opacity-15">
                <MarineIcon type="wave" size={110} color="#2563EB" animated />
              </div>
              <div className="absolute bottom-0 right-1/4 opacity-20">
                <MarineIcon type="fish" size={95} color="#0D9488" animated />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Capabilities Section */}
      <section className="relative py-20 bg-gradient-to-br from-cyan-600 via-blue-600 to-teal-700 overflow-hidden">
        <OceanWavePattern variant="animated" opacity={0.2} color="blue" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Technical Excellence
            </h2>
            <p className="text-white/90 text-lg max-w-3xl mx-auto">
              Built on industry standards and cutting-edge technologies for reliable, scalable marine data management
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Capability 1: Data Formats */}
            <div data-animate className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <MarineIcon type="compass" size={40} color="white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 text-center">Data Formats</h3>
              <ul className="space-y-2 text-white/90 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  netCDF (CF-compliant)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  CSV & Excel
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  JSON & XML
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  FASTA/FASTQ
                </li>
              </ul>
            </div>

            {/* Capability 2: Standards Compliance */}
            <div data-animate className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <MarineIcon type="anchor" size={40} color="white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 text-center">Standards Compliance</h3>
              <ul className="space-y-2 text-white/90 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  CF Conventions
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  BODC Vocabularies
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  ISO 19115 Metadata
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  MIxS Standards
                </li>
              </ul>
            </div>

            {/* Capability 3: Integrations */}
            <div data-animate className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <MarineIcon type="coral" size={40} color="white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 text-center">External APIs</h3>
              <ul className="space-y-2 text-white/90 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  WoRMS Database
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  BOLD Systems
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  GenBank
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  OBIS Network
                </li>
              </ul>
            </div>

            {/* Capability 4: Cloud Architecture */}
            <div data-animate className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <MarineIcon type="submarine" size={40} color="white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 text-center">Architecture</h3>
              <ul className="space-y-2 text-white/90 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Cloud-native
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Microservices
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  RESTful APIs
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Scalable Design
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Visualization & Dashboard Preview */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="text-center mb-12" data-animate>
            <div className="flex items-center justify-center mb-4">
              <MarineIcon type="wave" size={48} color="#0891B2" animated />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-4">
              Real-time Visualization
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Interactive dashboards and dynamic visualizations for comprehensive data exploration and insights
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-animate>
            {[
              { title: 'Interactive Charts', desc: 'Time series, scatter plots, and custom visualizations', icon: 'fish' },
              { title: 'Geographic Maps', desc: 'Spatial distribution and sampling location mapping', icon: 'compass' },
              { title: 'Biodiversity Distribution', desc: 'Species richness and diversity metrics', icon: 'coral' },
              { title: 'Ecosystem Health', desc: 'Real-time environmental condition monitoring', icon: 'wave' },
              { title: 'Correlation Displays', desc: 'Multi-parameter relationship analysis', icon: 'anchor' },
              { title: 'Custom Dashboards', desc: 'Personalized views for specific research needs', icon: 'submarine' }
            ].map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border-2 border-cyan-100 hover:border-cyan-300 transition">
                <div className="flex items-center gap-3 mb-3">
                  <MarineIcon type={feature.icon} size={24} color="#0891B2" animated={feature.icon === 'fish' || feature.icon === 'wave'} />
                  <h3 className="text-lg font-bold text-gray-800">{feature.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="relative py-20 bg-gradient-to-br from-cyan-600 via-blue-600 to-teal-700 overflow-hidden">
        <OceanWavePattern variant="animated" opacity={0.2} color="cyan" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6" data-animate>
            <MarineIcon type="submarine" size={64} color="white" animated />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" data-animate>
            Ready to Explore?
          </h2>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto" data-animate>
            Start leveraging the power of OcceanIQ for your marine research and data analysis projects today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" data-animate>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-8 py-4 bg-white text-cyan-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105"
            >
              Get Started
            </button>
            <button
              onClick={() => window.open('#', '_blank')}
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white/10 transition duration-300 transform hover:scale-105"
            >
              View Documentation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AllFeatures;