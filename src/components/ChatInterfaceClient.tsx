'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import MessageInput from './MessageInput';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import NewConversationButton from './NewConversationButton';

interface MessageContent {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: MessageContent[];
}
interface ChatInterfaceClientProps {
  initialConversationId?: string;
}
const ChatInterfaceClient: React.FC<ChatInterfaceClientProps> = ({ initialConversationId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>(initialConversationId || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const id = params?.id as string;
    if (id) {
      setConversationId(id);
      loadConversation(id);
    } else {
      createNewConversation();
    }
  }, [params?.id]);

  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/chat?conversationId=${id}`);
      console.log(response.body)
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      } else {
        console.error('Failed to load conversation');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const createNewConversation = () => {
    const newId = uuidv4();
    setConversationId(newId);
    setMessages([]);
    router.push(`/chat/${newId}`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (text: string, image?: File) => {
    if (!text.trim() && !image) return;

    let newMessageContent: MessageContent[] = [];

    if (image) {
      const imageBase64 = await convertToBase64(image);
      newMessageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.type,
          data: imageBase64
        }
      });
    }

    newMessageContent.push({ type: 'text', text });

    const newMessage: Message = {
      role: 'user',
      content: newMessageContent
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          conversationId
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: [{ type: 'text', text: data.response }] }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: [{ type: 'text', text: 'Sorry, an error occurred. Please try again.' }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const renderContent = (content: MessageContent) => {
    if (content.type === 'image' && content.source) {
      return (
        <img
          src={`data:${content.source.media_type};base64,${content.source.data}`}
          alt="User uploaded"
          className="max-w-full h-auto mb-2 rounded"
        />
      );
    } else if (content.type === 'text' && content.text) {
      return (
        <ReactMarkdown
          components={{
            code({ node, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <SyntaxHighlighter
                  language={match[1]}
                  PreTag="div"
                  {...props}
                  style={tomorrow}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
          }}
        >
          {content.text}
        </ReactMarkdown>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-gray-200 flex justify-between items-center">
        <h1 className="text-xl font-bold">Chat with Claude</h1>
        <div>
          <NewConversationButton />
          <Link href="/history" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-2">
            History
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {message.content.map((content, contentIndex) => (
                <div key={contentIndex}>
                  {renderContent(content)}
                </div>
              ))}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-center">Claude is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatInterfaceClient;