import Link from 'next/link';
import { getAllConversations } from '../../utils/fileUtils';
import NewConversationButton from '@/components/NewConversationButton';

export default async function HistoryPage() {
  const conversations = await getAllConversations();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Conversation History</h1>
        <NewConversationButton />
      </div>
      {conversations.length > 0 ? (
        <div className="space-y-4">
          {conversations.map((conv) => (
            <Link href={`/chat/${conv.id}`} key={conv.id}>
              <div className="border p-4 rounded hover:bg-gray-100 cursor-pointer">
                <p className="text-sm text-gray-600">{conv.preview}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-lg mb-4">No conversation history yet.</p>
        </div>
      )}
    </div>
  );
}