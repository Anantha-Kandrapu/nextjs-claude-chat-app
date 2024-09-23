import ChatInterfaceClient from '../../../components/ChatInterfaceClient';

export default function ChatPage({ params }: { params?: { id?: string } }) {
  return (
    <div className="h-screen">
      <ChatInterfaceClient initialConversationId={params?.id} />
    </div>
  );
}