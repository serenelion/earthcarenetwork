import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodeBlock from './CodeBlock';
import { cn } from '@/lib/utils';

interface LanguageExample {
  language: string;
  label: string;
  code: string;
  fileName?: string;
}

interface LanguageTabsProps {
  examples: LanguageExample[];
  title?: string;
  className?: string;
}

const languageIcons: Record<string, string> = {
  javascript: '🟨',
  python: '🐍',
  curl: '💻',
  bash: '💻',
  json: '📄',
  typescript: '🔷',
  react: '⚛️',
  node: '🟢',
};

export default function LanguageTabs({
  examples,
  title,
  className,
}: LanguageTabsProps) {
  const [activeTab, setActiveTab] = useState(examples[0]?.language || '');

  if (!examples || examples.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="language-tabs">
      {title && (
        <h4 className="text-lg font-semibold">{title}</h4>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full" style={{gridTemplateColumns: `repeat(${examples.length}, 1fr)`}}>
          {examples.map((example) => (
            <TabsTrigger
              key={example.language}
              value={example.language}
              className="flex items-center gap-2"
              data-testid={`tab-${example.language}`}
            >
              <span>{languageIcons[example.language] || '📝'}</span>
              {example.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {examples.map((example) => (
          <TabsContent key={example.language} value={example.language}>
            <CodeBlock
              language={example.language}
              fileName={example.fileName}
            >
              {example.code}
            </CodeBlock>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}