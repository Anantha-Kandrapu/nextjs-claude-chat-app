import Link from 'next/link';
import { getAllConversations } from '../../utils/fileUtils';
import NewConversationButton from '@/components/NewConversationButton';

export default async function HistoryPage() {
  const conversations = await getAllConversations();

  return (
    // Add an animated background gradient
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-gradient-slow"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-gray-800">
            Conversation History
          </h1>
          <NewConversationButton />
        </div>

        {/* Conversations List */}
        {conversations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conversations.map((conv) => (
              <Link href={`/chat/${conv.id}`} key={conv.id}>
                <div className="transform transition-all duration-300 hover:scale-105">
                  <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg overflow-hidden group">
                    {/* Synchronized gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-gradient-slow opacity-50"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-600 text-sm">
                          {new Date(conv.id).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 line-clamp-3 text-sm">
                        {conv.preview.substring(0, 100)}...
                      </p>
                      <div className="mt-4 flex justify-end">
                        <span className="text-blue-600 text-xs group-hover:text-blue-700">
                          View conversation →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg relative overflow-hidden">
            {/* Synchronized gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-gradient-slow opacity-50"></div>
            
            <div className="text-center p-8 relative z-10">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                No Conversations Yet
              </h3>
              <p className="text-gray-600 mb-8">
                Start a new conversation to begin your journey
              </p>
              <NewConversationButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}