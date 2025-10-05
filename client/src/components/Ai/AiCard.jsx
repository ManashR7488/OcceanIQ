import React from 'react'
import useAiStore from './../../store/useAiStore';

const AiCard = () => {
    const { messages, isShowChatBot, toggleChatBot, isLoading } = useAiStore();
  return (
    <div className='h-screen w-full bg-[#0000006e] backdrop-blur-[4px] fixed top-0 left-0 flex justify-center items-center z-[500]'>
        {/* close button */}
        <button onClick={toggleChatBot} className='absolute top-4 right-10 text-white px-3 py-1 bg-red-600 rounded-md hover:bg-red-700 active:bg-red-800 shadow-lg'>
          Close
        </button>

        {/* main chat component */}
    </div>
  )
}

export default AiCard