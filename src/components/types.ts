// components/chat/types.ts
export interface MessageContent {
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }
  
  export interface Message {
    role: 'user' | 'assistant';
    content: MessageContent[];
  }
  
  export interface ChatInterfaceClientProps {
    initialConversationId?: string;
  }
  