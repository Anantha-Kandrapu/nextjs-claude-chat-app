// components/chat/Message.tsx
import { Message as MessageType, MessageContent } from './types';
import MarkdownRenderer from './MarkdownRenderer';
import { CopyButton } from '../shared/CopyButton';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const messageText = message.content
    .map(content => content.type === 'text' ? content.text : '')
    .join('\n');

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
      return <MarkdownRenderer content={content.text} />;
    }
    return null;
  };

  return message.role === 'user' ? (
    <div className="mb-4 relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={messageText} />
      </div>
      <div className="mb-1 flex items-center">
        <span className="text-xs text-gray-400">You</span>
      </div>
      <div className="text-gray-900">
        {message.content.map((content, index) => (
          <div key={index} className="text-base">
            {renderContent(content)}
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="mb-4 bg-gray-50 rounded-lg border border-gray-100 relative group">
      {/* Assistant message rendering */}
    </div>
  );
};

export default Message;
