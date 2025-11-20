import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiMessageSquare, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import useCommunityStore from '../../store/useCommunityStore';
import QuestionCard from '../../components/Community/QuestionCard';

const Community = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isBasePath = location.pathname === '/app/community';

  const { 
    questions, 
    questionsLoading, 
    pagination, 
    filters, 
    fetchQuestions, 
    setFilters,
    justCreatedQuestion,
    clearJustCreatedFlag
  } = useCommunityStore();

  useEffect(() => {
    // Only fetch on mount if we're on base path and we don't have a recently created question
    if (isBasePath && !justCreatedQuestion && questions.length === 0) {
      fetchQuestions(1, false);
    }
  }, [isBasePath, justCreatedQuestion, questions.length, fetchQuestions]);

  const handleLoadMore = () => {
    fetchQuestions(pagination.page + 1, true);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  if (!isBasePath) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/app/community')}
            className="flex items-center gap-2 mb-6 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all text-gray-700 hover:text-blue-600"
          >
            <FiArrowLeft size={20} />
            Back to Questions
          </button>
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Community Discussions
              </h1>
              <p className="text-gray-600">
                Ask questions, share knowledge, and connect with marine researchers
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  clearJustCreatedFlag();
                  fetchQuestions(1, false);
                }}
                aria-label="Refresh questions"
                title="Refresh questions"
                className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700"
              >
                <FiRefreshCw />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tag filter */}
              <input
                type="text"
                placeholder="Filter by tag..."
                value={filters.tags}
                onChange={(e) => handleFilterChange('tags', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Resolved filter */}
              <select
                value={filters.isResolved}
                onChange={(e) => handleFilterChange('isResolved', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Questions</option>
                <option value="false">Unanswered</option>
                <option value="true">Resolved</option>
              </select>

              {/* Sort */}
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="unanswered">Unanswered</option>
              </select>
            </div>
          </div>
        </div>

        {/* New question banner */}
        {justCreatedQuestion && (
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-300 rounded">
            <div className="flex items-center justify-between">
              <div className="text-sm text-yellow-800">New question posted! It may take a moment to appear in server results.</div>
              <div>
                <button
                  onClick={() => { clearJustCreatedFlag(); fetchQuestions(1, false); }}
                  className="text-sm px-3 py-1 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions Grid */}
        {questionsLoading && pagination.page === 1 ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FiMessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No questions yet</h3>
            <p className="text-gray-600 mb-6">
              Be the first to ask a question in the community!
            </p>
            <Link
              to="/app/community/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg"
            >
              <FiPlus size={20} />
              Ask a Question
            </Link>
          </div>
        ) : (
          <>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 mb-6">
              {questions.map((question) => (
                <div key={question._id} className="break-inside-avoid">
                  <QuestionCard question={question} variant="list" />
                </div>
              ))}
            </div>

            {/* Load More */}
            {pagination.hasMore && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={questionsLoading}
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {questionsLoading ? 'Loading...' : 'Load More Questions'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Floating Action Button */}
        <Link
          to="/app/community/new"
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center hover:scale-110 transition-all z-50"
          aria-label="Ask a question"
        >
          <FiPlus size={28} />
        </Link>
      </div>
    </div>
  );
};

export default Community;
