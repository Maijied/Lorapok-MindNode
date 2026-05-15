import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownPreview = ({ content }) => {
    return (
        <div className="prose prose-zinc dark:prose-invert max-w-none p-6 h-full overflow-y-auto font-light leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownPreview;
