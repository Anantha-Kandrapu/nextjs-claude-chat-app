// components/chat/Header.tsx
'use client';
import Link from 'next/link';
import MessageInput from './MessageInput';
import VoiceInput from './VoiceInput';
import NewConversationButton from './NewConversationButton';

interface HeaderProps {
  onSendMessage: (text: string, image?: File) => Promise<void>;
  onSpeechRecognized: (transcript: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSendMessage, onSpeechRecognized }) => (
  <div className="border-b border-gray-200 p-2 bg-white sticky top-0 z-10">
    <div className="max-w-7xl mx-auto flex items-center gap-2">
      <div className="flex-grow">
        <MessageInput onSendMessage={onSendMessage} />
      </div>
      <VoiceInput onSpeechRecognized={onSpeechRecognized} />
      <NewConversationButton />
      <Link
        href="/history"
        target="_blank"
        className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100"
      >
        History
      </Link>
    </div>
  </div>
);

export default Header;
