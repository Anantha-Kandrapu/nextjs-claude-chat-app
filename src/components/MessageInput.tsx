'use client'

import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (text: string, image?: File) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              setImage(blob);
              e.preventDefault();
              break;
            }
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || image) {
      onSendMessage(message, image || undefined);
      setMessage('');
      setImage(null);
      if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
      <div className="flex flex-col items-stretch">
        {image && (
          <div className="mb-2">
            <img
              src={URL.createObjectURL(image)}
              alt="Pasted"
              className="max-h-32 rounded"
            />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="text-red-500 text-sm mt-1"
            >
              Remove Image
            </button>
          </div>
        )}
        <div className="flex items-end">
          <textarea
            ref={textAreaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
            rows={1}
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-r-lg h-[40px]"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;