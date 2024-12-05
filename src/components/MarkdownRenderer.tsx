// components/chat/MarkdownRenderer.tsx
import { CopyButton } from '@/shared/CopyButton';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => (
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
                            className="rounded-lg !bg-gray-100 p-3"
                        >
                            {codeText}
                        </SyntaxHighlighter>
                    </div>
                ) : (
                    <code className="bg-gray-100 text-gray-900 rounded px-1.5 py-0.5" {...props}>
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
                <h1 className="text-xl font-bold mb-3 text-gray-900">{children}</h1>
            ),
            h2: ({ children }) => (
                <h2 className="text-lg font-bold mb-2 text-gray-900">{children}</h2>
            ),
            h3: ({ children }) => (
                <h3 className="text-base font-bold mb-2 text-gray-900">{children}</h3>
            ),
            a: ({ children, href }) => (
                <a href={href} className="text-gray-700 hover:text-gray-900 underline">
                    {children}
                </a>
            ),
            blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4 text-gray-700">
                    {children}
                </blockquote>
            ),
        }}
    >
        {content}
    </ReactMarkdown >
);

export default MarkdownRenderer;
