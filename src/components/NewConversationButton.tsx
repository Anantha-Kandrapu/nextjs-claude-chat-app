'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const NewConversationButton: React.FC = () => {
  const router = useRouter();

  const createNewConversation = () => {
    const newId = uuidv4();
    router.push(`/chat/${newId}`);
  };

  return (
    <button
      onClick={createNewConversation}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
    >
      New Conversation
    </button>
  );
};

export default NewConversationButton;