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
import VoiceInput from './VoiceInput';
import { CopyButton } from '../shared/CopyButton';

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
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [conversationId, setConversationId] = useState<string>(initialConversationId || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    const id = params?.id as string;
    if (id) {
      setConversationId(id);
      loadConversation(id);
    } else {
      createNewConversation();
    }
  }, [params?.id]);
  const cancelStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  };
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
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(scrollToBottom, [messages]);
  const handleSendMessage = async (text: string, image?: File) => {
    if (!text.trim() && !image) return;

    abortControllerRef.current = new AbortController();

    // Prepare message content
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

    // Create new user message
    const newMessage: Message = {
      role: 'user',
      content: newMessageContent
    };

    // Update messages with user's message
    const updatedMessages = combineSuccessiveUserMessages([...messages, newMessage]);
    setMessages(updatedMessages);
    setIsLoading(true);
    setIsStreaming(true);

    try {
      // Add empty assistant message for streaming
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: [{ type: 'text', text: '' }]
      }]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          conversationId
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      const assistantMessageIndex = updatedMessages.length;
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedText += chunk;

        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[assistantMessageIndex]?.role === 'assistant') {
            newMessages[assistantMessageIndex].content[0] = {
              type: 'text',
              text: accumulatedText
            };
          }
          return newMessages;
        });
      }

    } catch (error: any) {
      console.error('Error:', error);
      if (error.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: [{
            type: 'text',
            text: 'Sorry, an error occurred. Please try again.'
          }]
        }]);
      }
    } finally {
      setIsStreaming(false);
      setIsLoading(false);
      abortControllerRef.current = null;
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
          className="max-h-96 rounded-lg my-2"
        />
      );
    } else if (content.type === 'text' && content.text) {
      return (
        <ReactMarkdown
          components={{
            code({ node, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const codeText = String(children).replace(/\n$/, '');
              return match ? (
                <div className="my-2 relative group">
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={codeText} />
                  </div>
                  <SyntaxHighlighter
                    language={match[1]}
                    PreTag="div"
                    {...props}
                    style={tomorrow}
                    className="rounded-lg !bg-gray-800 p-4 text-base"
                    customStyle={{
                      backgroundColor: '#1a1a1a',
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                  >
                    {codeText}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className="bg-gray-800 text-gray-100 rounded px-2 py-1" {...props}>
                  {children}
                </code>
              );
            },

            p: ({ children }) => (
              <p className="mb-3 leading-7 text-gray-900">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-4 mb-3 space-y-1 text-gray-900">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-4 mb-3 space-y-1 text-gray-900">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="mb-0.5 text-gray-900">{children}</li>
            ),
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mb-3 text-gray-900">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold mb-2 text-gray-900">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-bold mb-2 text-gray-900">{children}</h3>
            ),
            a: ({ children, href }) => (
              <a href={href} className="text-blue-600 hover:text-blue-800 underline">
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-800">
                {children}
              </blockquote>
            ),
          }}
        >
          {content.text}
        </ReactMarkdown>
      );
    }
    return null;
  };

  const combineSuccessiveUserMessages = (messages: Message[]): Message[] => {
    return messages.reduce((acc: Message[], current, index) => {
      if (index === 0) {
        acc.push(current);
        return acc;
      }

      const previousMessage = acc[acc.length - 1];

      // If current and previous messages are both from user, combine them
      if (current.role === 'user' && previousMessage.role === 'user') {
        previousMessage.content = [...previousMessage.content, ...current.content];
      } else {
        acc.push(current);
      }

      return acc;
    }, []);
  };

  const handleSpeechRecognized = (transcript: string) => {
    handleSendMessage(transcript);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - More compact */}
      <div className="border-b border-gray-200 p-2 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <div className="flex-grow">
            <MessageInput onSendMessage={handleSendMessage} />
          </div>
          <VoiceInput onSpeechRecognized={handleSpeechRecognized} />
          <NewConversationButton />
          <Link
            href="/history"
            target="_blank" // Open history in new tab
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100"
          >
            History
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-white"> {/* Changed to white background */}
        <div className="max-w-7xl mx-auto px-4 py-2 space-y-4">
          {messages.map((message, index) => {
            const messageText = message.content
              .map(content => content.type === 'text' ? content.text : '')
              .join('\n');

            return (
              <div key={index}>
                {message.role === 'user' ? (
                  <div className="mb-4 relative group">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyButton text={messageText} />
                    </div>
                    <div className="mb-1 flex items-center">
                      <span className="text-xs text-gray-400">You</span>
                    </div>
                    <div className="text-gray-900">
                      {message.content.map((content, contentIndex) => (
                        <div key={contentIndex} className="text-base">
                          {renderContent(content)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 bg-gray-50 rounded-lg border border-gray-100 relative group">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyButton text={messageText} />
                    </div>
                    <div className="p-4">
                      <div className="mb-1 flex items-center">
                        <span className="text-xs font-medium text-gray-500">Assistant</span>
                      </div>
                      <div className="text-gray-900">
                        {message.content.map((content, contentIndex) => (
                          <div key={contentIndex} className="text-base">
                            {renderContent(content)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {isStreaming && (
            <div className="flex justify-center p-2">
              <button
                onClick={cancelStream}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Stop Generating
              </button>
            </div>
          )}
          {isLoading && !isStreaming && (
            <div className="flex justify-center p-2">
              <span className="text-gray-500 text-sm">Processing...</span>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-center p-2">
              <span className="text-gray-500 text-sm">Processing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterfaceClient;