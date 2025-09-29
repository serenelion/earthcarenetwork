import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HTTPMethodBadgeProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  className?: string;
}

const methodStyles = {
  GET: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
  POST: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
  PUT: 'bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-300',
  DELETE: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300',
  PATCH: 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
};

export default function HTTPMethodBadge({ method, className }: HTTPMethodBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-mono text-xs font-semibold min-w-[60px] justify-center',
        methodStyles[method],
        className
      )}
      data-testid={`http-method-${method.toLowerCase()}`}
    >
      {method}
    </Badge>
  );
}