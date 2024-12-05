import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
    const newConversationId = uuidv4();
    redirect(`/chat/${newConversationId}`);
}
