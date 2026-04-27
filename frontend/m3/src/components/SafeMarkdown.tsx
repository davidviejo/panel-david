import React from 'react';

interface SafeMarkdownProps {
  content: string;
}

export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content }) => {
  if (!content) return null;

  const renderContent = () => {
    const blocks = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    const flushList = (keyPrefix: string) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${keyPrefix}`} className="list-disc pl-5 mb-2">
            {listItems}
          </ul>
        );
        listItems = [];
      }
    };

    blocks.forEach((line, index) => {
      const key = `line-${index}`;

      // Headers
      if (line.startsWith('### ')) {
        flushList(key);
        elements.push(
          <h3 key={key} className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2">
            {renderInline(line.substring(4))}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        flushList(key);
        elements.push(
          <h4 key={key} className="text-md font-bold text-slate-700 dark:text-slate-300 mt-3 mb-1">
            {renderInline(line.substring(5))}
          </h4>
        );
      }
      // Lists
      else if (line.trim().startsWith('- ')) {
        listItems.push(
          <li key={key} className="text-slate-600 dark:text-slate-300">
            {renderInline(line.trim().substring(2))}
          </li>
        );
      }
      // Paragraphs/Newlines
      else {
        flushList(key);
        if (line.trim() === '') {
           elements.push(<br key={key} />);
        } else {
           elements.push(
             <p key={key} className="mb-1 text-slate-600 dark:text-slate-300">
               {renderInline(line)}
             </p>
           );
        }
      }
    });

    flushList('end');
    return elements;
  };

  const renderInline = (text: string): React.ReactNode[] => {
    // Regex for matching **bold** text
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-slate-900 dark:text-white">
            {part.substring(2, part.length - 2)}
          </strong>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return <div className="safe-markdown">{renderContent()}</div>;
};
