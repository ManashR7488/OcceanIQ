import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiVideo, FiCalendar, FiClock, FiX, FiCopy, FiCheck } from 'react-icons/fi';
import { FaRegKeyboard } from "react-icons/fa";

const Connect = () => {
  const [meetingCode, setMeetingCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false); // true if joining, false if creating
  const [generatedId, setGeneratedId] = useState('');
  const navigate = useNavigate();

  const handleNewMeeting = () => {
    const randomId = 'OceanIQ-' + Math.random().toString(36).substring(2, 12);
    setGeneratedId(randomId);
    setIsJoining(false);
    setShowModal(true);
  };

  const handleJoinClick = (e) => {
    e.preventDefault();
    if (meetingCode.trim()) {
      setGeneratedId(meetingCode.trim());
      setIsJoining(true);
      setShowModal(true);
    }
  };

  const handleStartMeeting = (e) => {
    e.preventDefault();
    if (userName.trim()) {
      // Navigate to meeting with meetingId and userName
      navigate(`/app/connect/${generatedId}`, { state: { userName: userName } });
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + 
           now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden relative">
      {/* Header */}
      <header className="flex justify-between items-center p-4 px-6">
        <div className="flex items-center gap-2 text-gray-600">
          <div className="text-xl font-medium text-gray-500">Connect</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-gray-600 text-lg">{getCurrentTime()}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl w-full gap-12">
          
          {/* Left Side - Controls */}
          <div className="flex-1 max-w-lg space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-normal text-gray-800 leading-tight">
                Premium video meetings. Now free for everyone.
              </h1>
              <p className="text-xl text-gray-500 font-light">
                We re-engineered the service we built for secure business meetings, 
                OceanIQ Connect, to make it free and available for all.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={handleNewMeeting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors shadow-sm w-full sm:w-auto justify-center"
              >
                <FiVideo size={20} />
                New meeting
              </button>

              <form onSubmit={handleJoinClick} className="flex items-center gap-3 w-full sm:w-auto relative">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <FaRegKeyboard size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter a code or link"
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!meetingCode.trim()}
                  className={`font-medium px-4 py-3 rounded-md transition-colors ${
                    meetingCode.trim() 
                      ? 'text-blue-600 hover:bg-blue-50 cursor-pointer' 
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Join
                </button>
              </form>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <div className="text-gray-500 mb-4">
                <span className="font-medium text-gray-600">Learn more</span> about OceanIQ Connect
              </div>
            </div>
          </div>

          {/* Right Side - Carousel/Image */}
          <div className="flex-1 flex justify-center items-center">
            <div className="relative w-full max-w-md aspect-square bg-white rounded-full flex items-center justify-center">
               <div className="grid grid-cols-2 gap-4 p-8">
                  <div className="bg-blue-100 rounded-2xl p-4 h-40 w-40 flex items-center justify-center transform translate-y-4">
                    <div className="bg-blue-200 rounded-full w-20 h-20 flex items-center justify-center">
                        <FiVideo size={40} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-indigo-100 rounded-2xl p-4 h-40 w-40 flex items-center justify-center transform -translate-y-4">
                     <div className="bg-indigo-200 rounded-full w-20 h-20 flex items-center justify-center">
                        <FiCalendar size={40} className="text-indigo-600" />
                    </div>
                  </div>
                  <div className="bg-teal-100 rounded-2xl p-4 h-40 w-40 flex items-center justify-center transform translate-y-4">
                     <div className="bg-teal-200 rounded-full w-20 h-20 flex items-center justify-center">
                        <FiClock size={40} className="text-teal-600" />
                    </div>
                  </div>
                  <div className="bg-sky-100 rounded-2xl p-4 h-40 w-40 flex items-center justify-center transform -translate-y-4">
                     <div className="bg-sky-200 rounded-full w-20 h-20 flex items-center justify-center">
                        <FiVideo size={40} className="text-sky-600" />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Name Input Modal */}
      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {isJoining ? 'Join Meeting' : 'Create Meeting'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleStartMeeting} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>

              {!isJoining && (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                    Meeting ID
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {generatedId}
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedId)}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Copy ID"
                    >
                      <FiCopy size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Share this ID with others so they can join.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!userName.trim()}
                  className={`flex-1 px-4 py-2 text-white rounded-md font-medium transition-colors ${
                    userName.trim() 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-sm' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isJoining ? 'Join Now' : 'Start Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connect;
