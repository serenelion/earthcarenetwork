import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  className?: string;
}

export default function TableOfContents({ className }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [location] = useLocation();

  useEffect(() => {
    // Extract headings from the current page
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const items: TOCItem[] = [];

    headings.forEach((heading) => {
      const id = heading.id || heading.textContent?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-') || '';
      const level = parseInt(heading.tagName.charAt(1));
      const title = heading.textContent || '';

      if (id && title && level >= 2 && level <= 4) {
        // Ensure heading has an ID for navigation
        heading.id = id;
        items.push({ id, title, level });
      }
    });

    setTocItems(items);
  }, [location]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0.1,
      }
    );

    tocItems.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)} data-testid="table-of-contents">
      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        On This Page
      </h4>
      <nav className="space-y-1">
        {tocItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={cn(
              'block text-left text-sm transition-colors hover:text-foreground',
              item.level === 2 && 'pl-0',
              item.level === 3 && 'pl-4',
              item.level === 4 && 'pl-8',
              activeId === item.id
                ? 'text-foreground font-medium border-l-2 border-primary pl-3'
                : 'text-muted-foreground border-l-2 border-transparent pl-3'
            )}
            data-testid={`toc-item-${item.id}`}
          >
            {item.title}
          </button>
        ))}
      </nav>
    </div>
  );
}