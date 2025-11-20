import React, { useState, useEffect } from 'react';
import { FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useCommunityStore from '../../store/useCommunityStore';

const VoteButtons = ({
  itemId,
  itemType, // 'question' or 'comment'
  initialVoteScore = 0,
  initialUserVote = null,
  onVoteChange
}) => {
  const [voteScore, setVoteScore] = useState(initialVoteScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toggleQuestionVote, toggleCommentVote } = useCommunityStore();

  // Sync state with parent props (e.g., after refetch)
  useEffect(() => {
    setVoteScore(initialVoteScore);
    setUserVote(initialUserVote);
  }, [initialVoteScore, initialUserVote]);

  const handleVote = async (voteType) => {
    if (isLoading) return;

    // Optimistic update
    const previousScore = voteScore;
    const previousVote = userVote;

    let newScore = voteScore;
    let newVote = null;

    // Calculate new score based on current state and vote type
    if (userVote === voteType) {
      // Removing vote
      newVote = null;
      newScore = voteType === 'upvote' ? voteScore - 1 : voteScore + 1;
    } else if (userVote === null) {
      // Adding new vote
      newVote = voteType;
      newScore = voteType === 'upvote' ? voteScore + 1 : voteScore - 1;
    } else {
      // Switching vote
      newVote = voteType;
      newScore = voteType === 'upvote' ? voteScore + 2 : voteScore - 2;
    }

    // Update UI immediately
    setVoteScore(newScore);
    setUserVote(newVote);

    setIsLoading(true);

    try {
      let result;
      
      if (itemType === 'question') {
        result = await toggleQuestionVote(itemId, voteType);
      } else {
        result = await toggleCommentVote(itemId, voteType);
      }

      // Update with actual server response
      if (result.success) {
        setVoteScore(result.voteScore);
        setUserVote(result.userVote);
        
        if (onVoteChange) {
          onVoteChange({
            voteScore: result.voteScore,
            userVote: result.userVote
          });
        }
      } else {
        // Revert on error
        setVoteScore(previousScore);
        setUserVote(previousVote);
      }
    } catch (error) {
      // Revert on error
      setVoteScore(previousScore);
      setUserVote(previousVote);
      
      console.error('Vote error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote('upvote')}
        disabled={isLoading}
        className={`p-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          userVote === 'upvote'
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'text-gray-500 hover:bg-green-50 hover:text-green-600'
        }`}
        aria-label={`Like this ${itemType}`}
        title="Like"
      >
        <FiThumbsUp size={16} />
      </button>

      <span className={`min-w-[40px] text-center font-semibold text-sm ${
        voteScore > 0 ? 'text-green-600' : voteScore < 0 ? 'text-red-600' : 'text-gray-600'
      }`}>
        {voteScore > 0 ? '+' : ''}{voteScore}
      </span>

      <button
        onClick={() => handleVote('downvote')}
        disabled={isLoading}
        className={`p-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          userVote === 'downvote'
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
        }`}
        aria-label={`Dislike this ${itemType}`}
        title="Dislike"
      >
        <FiThumbsDown size={16} />
      </button>
    </div>
  );
};

export default VoteButtons;
