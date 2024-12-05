// components/chat/MessageList.tsx
import React from 'react';
import { Message as MessageType } from './types';
import Message from './Message';

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  messagesEndRef
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto px-4 py-2 space-y-4">
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex justify-center p-2">
            <LoadingIndicator />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
