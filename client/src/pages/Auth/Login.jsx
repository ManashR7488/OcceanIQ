import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStore from "../../store/useAuthStore";
import OceanWavePattern from "../../components/OceanWavePattern";
import MarineIcon from "../../components/MarineIcon";

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!formData.password || formData.password.trim() === "") {
      toast.error("Password is required");
      return;
    }

    if (formData.password.length < 6) {
      toast.warn("password should be 6 characters");
      return;
    }

    // Call login from store
    const result = await login(formData);

    if (result.success) {
      toast.success("Login successful!");
      navigate("/app");
    } else {
      toast.error(result.error || "Login failed. Please try again.");
    }
  };

  const handleDemoCredentials = () => {
    setFormData({
      email: "demo@occeaniq.com",
      password: "Demo@123",
    });
    toast.info("Demo credentials filled! Click Sign In to continue.");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Section - Description Panel */}
      <div className="relative bg-gradient-to-br from-cyan-600 via-blue-600 to-teal-700 min-h-screen flex items-center justify-center p-8 lg:p-12 overflow-hidden">
        {/* Ocean Wave Background */}
        <OceanWavePattern variant="animated" opacity={0.2} color="blue" />

        <div className="relative z-10 max-w-lg text-white">
          {/* Logo/Branding */}
          <div className="flex items-center justify-center mb-8">
            <MarineIcon type="submarine" size={64} color="white" animated />
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-center">
            OcceanIQ
          </h1>
          <h2 className="text-xl lg:text-2xl font-semibold mb-6 text-center text-cyan-100">
            Marine Data Platform
          </h2>

          <div className="space-y-4 mb-8">
            <p className="text-lg text-center text-white/90">
              AI-Driven Unified Data Platform
            </p>
            <p className="text-center text-white/80">
              Oceanographic, Fisheries & Biodiversity Insights
            </p>
            <p className="text-sm text-center text-white/70">
              Centre for Marine Living Resources and Ecology (CMLRE)
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <MarineIcon type="compass" size={24} color="white" />
              <div>
                <h3 className="font-semibold text-white">
                  Unified Data Integration
                </h3>
                <p className="text-sm text-white/70">
                  Seamless data consolidation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <MarineIcon type="fish" size={24} color="white" animated />
              <div>
                <h3 className="font-semibold text-white">
                  AI-Powered Analytics
                </h3>
                <p className="text-sm text-white/70">
                  Smart insights & predictions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <MarineIcon type="wave" size={24} color="white" animated />
              <div>
                <h3 className="font-semibold text-white">
                  Real-time Visualization
                </h3>
                <p className="text-sm text-white/70">
                  Interactive data dashboards
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <MarineIcon type="coral" size={24} color="white" />
              <div>
                <h3 className="font-semibold text-white">
                  Molecular Biodiversity
                </h3>
                <p className="text-sm text-white/70">eDNA & taxonomy tools</p>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 opacity-20">
            <MarineIcon type="whale" size={80} color="white" />
          </div>
          <div className="absolute bottom-10 left-10 opacity-20">
            <MarineIcon type="anchor" size={60} color="white" />
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="relative bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 min-h-screen flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* Ocean Wave Background */}
        <OceanWavePattern variant="background" opacity={0.1} color="cyan" />

        <div className="w-full max-w-md relative z-10">
          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 relative overflow-hidden">
            {/* Ocean Wave Pattern Top */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500"></div>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <MarineIcon type="wave" size={40} color="#0891B2" animated />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600">Access the Marine Data Platform</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition duration-200 outline-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition duration-200 outline-none"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5 text-gray-400 hover:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-gray-400 hover:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700 cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-cyan-600 hover:text-cyan-700 font-medium transition duration-200"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Demo Credentials Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleDemoCredentials}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-cyan-600 text-cyan-600 rounded-lg hover:bg-cyan-50 transition duration-200 font-medium"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  Use Demo Credentials
                </button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Click to auto-fill demo credentials for testing
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 hover:from-cyan-700 hover:via-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/app/auth/register")}
                className="text-cyan-600 hover:text-cyan-700 font-medium text-sm transition duration-200"
              >
                Create new account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
