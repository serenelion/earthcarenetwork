import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: string;
  language?: string;
  title?: string;
  fileName?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
}

export default function CodeBlock({
  children,
  language = 'javascript',
  title,
  fileName,
  showLineNumbers = false,
  highlightLines = [],
  className,
}: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = children.trim().split('\n');

  return (
    <div className={cn('relative group', className)} data-testid="code-block">
      {/* Header */}
      {(title || fileName) && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border border-b-0 rounded-t-lg">
          <div className="flex items-center gap-2">
            {fileName && (
              <span className="text-sm font-mono text-muted-foreground">
                {fileName}
              </span>
            )}
            {title && (
              <span className="text-sm font-medium">
                {title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase">
              {language}
            </span>
          </div>
        </div>
      )}

      {/* Code Container */}
      <div className="relative">
        <pre
          className={cn(
            'bg-muted/30 border rounded-lg p-4 overflow-x-auto text-sm font-mono',
            (title || fileName) && 'rounded-t-none border-t-0'
          )}
        >
          <code className={cn(`language-${language}`)}>
            {showLineNumbers ? (
              <div className="table w-full">
                {lines.map((line, index) => {
                  const lineNumber = index + 1;
                  const isHighlighted = highlightLines.includes(lineNumber);
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        'table-row',
                        isHighlighted && 'bg-primary/10 -mx-4 px-4'
                      )}
                    >
                      <span className="table-cell select-none w-10 text-right pr-4 text-muted-foreground/60">
                        {lineNumber}
                      </span>
                      <span className="table-cell">{line}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              children
            )}
          </code>
        </pre>

        {/* Copy Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={copyToClipboard}
          data-testid="copy-code-btn"
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}