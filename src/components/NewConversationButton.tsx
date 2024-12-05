'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const NewConversationButton: React.FC = () => {

  const createNewConversation = () => {
    const newId = uuidv4();
    window.open(`/chat/${newId}`, '_blank');
  };

  return (
    <button
      onClick={createNewConversation}
      className="px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transform transition-all duration-300 hover:scale-105 relative overflow-hidden group">

      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-gradient-slow opacity-0 group-hover:opacity-50"></div>
      <span className="relative z-10">New Conversation</span>
    </button>
  );
};

export default NewConversationButton;