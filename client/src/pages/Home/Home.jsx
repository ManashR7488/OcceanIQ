import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OceanWavePattern from '../../components/OceanWavePattern';
import MarineIcon from '../../components/MarineIcon';

const Home = () => {
  const navigate = useNavigate();
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const observerRef = useRef(null);
  const videoRef = useRef(null);

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
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setVideoError(true)}
          >
            <source src="/videos/bg.mp4" type="video/mp4" />
          </video>
        )}
        
        {/* Fallback Gradient Background - Only shows when video fails */}
        {videoError && (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-blue-700 to-teal-800" />
        )}
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Ocean Wave Pattern */}
        <OceanWavePattern variant="animated" opacity={0.15} color="cyan" />
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <MarineIcon type="submarine" className='h-50 w-50' color="white" animated />
          </div>
          
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-cyan-300 via-blue-200 to-teal-300 bg-clip-text text-transparent">
            OcceanIQ
          </h1>
          
          {/* Subheading */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-6 text-cyan-100">
            AI-Driven Marine Data Platform
          </h2>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-white/90 mb-4 max-w-3xl mx-auto">
            Unifying Oceanographic, Fisheries & Biodiversity Data for Advanced Research
          </p>
          <p className="text-base md:text-lg text-white/80 mb-12 max-w-2xl mx-auto">
            Powered by Centre for Marine Living Resources and Ecology (CMLRE), Ministry of Earth Sciences
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/app')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 text-white font-semibold rounded-lg shadow-lg hover:from-cyan-600 hover:via-blue-600 hover:to-teal-600 transition duration-300 transform hover:scale-105 animate-pulse-glow"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/app')}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border-2 border-white/50 hover:bg-white/20 transition duration-300 transform hover:scale-105"
            >
              Explore Platform
            </button>
          </div>
        </div>
        
        {/* Scroll Down Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-slow">
          <div className="flex flex-col items-center text-white/80">
            <span className="text-sm mb-2">Scroll Down</span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>

        {/* Mute/Unmute Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-20 right-8 z-20 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </section>

      {/* Features Section */}
      <section className="relative py-20 bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 overflow-hidden">
        <OceanWavePattern variant="background" opacity={0.1} color="blue" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-4">
              Platform Features
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Comprehensive tools and insights for marine research and data analysis
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div
              data-animate
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl mb-6">
                <MarineIcon type="compass" size={32} color="white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Unified Data Integration
              </h3>
              <p className="text-gray-600">
                Seamlessly consolidate data from multiple sources including oceanographic sensors, research vessels, and satellite observations into a single unified platform.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div
              data-animate
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl mb-6">
                <MarineIcon type="fish" size={32} color="white" animated />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                AI-Powered Analytics
              </h3>
              <p className="text-gray-600">
                Leverage advanced machine learning algorithms to analyze marine patterns, predict fisheries trends, and generate actionable insights from complex datasets.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div
              data-animate
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl mb-6">
                <MarineIcon type="wave" size={32} color="white" animated />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Real-time Visualization
              </h3>
              <p className="text-gray-600">
                Interactive dashboards and dynamic visualizations provide real-time insights into oceanographic conditions, marine ecosystems, and environmental changes.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div
              data-animate
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl mb-6">
                <MarineIcon type="coral" size={32} color="white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Molecular Biodiversity
              </h3>
              <p className="text-gray-600">
                Advanced eDNA analysis and taxonomy tools for comprehensive biodiversity assessment, species identification, and ecosystem health monitoring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative py-20 bg-white overflow-hidden">
        <OceanWavePattern variant="background" opacity={0.05} color="teal" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <div data-animate>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-6">
                About OcceanIQ
              </h2>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                OcceanIQ is a cutting-edge marine data platform developed in collaboration with the Centre for Marine Living Resources and Ecology (CMLRE), under the Ministry of Earth Sciences, Government of India.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Our mission is to revolutionize marine research by providing scientists, researchers, and policymakers with unified access to comprehensive oceanographic, fisheries, and biodiversity data enhanced with AI-driven insights.
              </p>
              
              {/* Key Capabilities */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Key Capabilities:</h3>
                {[
                  'Multi-source data integration and harmonization',
                  'Advanced AI/ML models for pattern recognition',
                  'Real-time environmental monitoring',
                  'Molecular biodiversity analysis tools',
                  'Collaborative research environment',
                  'Policy-driven decision support'
                ].map((capability, index) => (
                  <div key={index} className="flex items-start gap-3">
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right - Decorative Marine Icons */}
            <div className="relative h-96 lg:h-full min-h-[400px]" data-animate>
              <div className="absolute top-0 right-0 opacity-20">
                <MarineIcon type="whale" size={120} color="#0891B2" />
              </div>
              <div className="absolute top-1/3 left-0 opacity-20">
                <MarineIcon type="anchor" size={100} color="#2563EB" />
              </div>
              <div className="absolute bottom-0 right-1/4 opacity-20">
                <MarineIcon type="shell" size={90} color="#0D9488" />
              </div>
              <div className="absolute top-1/2 right-1/3 opacity-10">
                <MarineIcon type="fish" size={80} color="#0891B2" animated />
              </div>
              <div className="absolute bottom-1/4 left-1/3 opacity-10">
                <MarineIcon type="coral" size={70} color="#2563EB" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative py-20 bg-gradient-to-br from-cyan-600 via-blue-600 to-teal-700 overflow-hidden">
        <OceanWavePattern variant="animated" opacity={0.2} color="blue" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="text-center mb-16" data-animate>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Platform by Numbers
            </h2>
            <p className="text-white/80 text-lg">
              Empowering marine research with comprehensive data and insights
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Stat 1 */}
            <div data-animate className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <MarineIcon type="compass" size={40} color="white" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">50+</div>
              <div className="text-white/90 font-medium">Data Sources Integrated</div>
            </div>
            
            {/* Stat 2 */}
            <div data-animate className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <MarineIcon type="fish" size={40} color="white" animated />
              </div>
              <div className="text-5xl font-bold text-white mb-2">10K+</div>
              <div className="text-white/90 font-medium">Species Catalogued</div>
            </div>
            
            {/* Stat 3 */}
            <div data-animate className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <MarineIcon type="coral" size={40} color="white" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">200+</div>
              <div className="text-white/90 font-medium">Research Projects</div>
            </div>
            
            {/* Stat 4 */}
            <div data-animate className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <MarineIcon type="submarine" size={40} color="white" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">500+</div>
              <div className="text-white/90 font-medium">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gray-900 text-white pt-16 pb-8 overflow-hidden">
        {/* Ocean Wave Pattern at Top */}
        <div className="absolute top-0 left-0 w-full">
          <svg className="w-full h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              fill="#0891B2"
              opacity="0.3"
            />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* About Column */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <MarineIcon type="wave" size={32} color="white" animated />
                <h3 className="text-2xl font-bold">OcceanIQ</h3>
              </div>
              <p className="text-gray-400 mb-4">
                AI-Driven Marine Data Platform revolutionizing oceanographic research and biodiversity conservation.
              </p>
              <div className="flex gap-4">
                {/* Social Media Icons Placeholder */}
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links Column */}
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Research
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Contact Column */}
            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Centre for Marine Living Resources and Ecology (CMLRE)</li>
                <li>Ministry of Earth Sciences</li>
                <li>Government of India</li>
                <li className="pt-2">
                  <a href="mailto:info@occeaniq.in" className="text-cyan-400 hover:text-cyan-300 transition">
                    info@occeaniq.in
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p className="mb-2">
              © {new Date().getFullYear()} OcceanIQ. All rights reserved.
            </p>
            <p className="text-sm">
              Developed in collaboration with CMLRE, Ministry of Earth Sciences, Government of India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
