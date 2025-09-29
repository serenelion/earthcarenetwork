import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Parameter {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  default?: string;
  example?: string;
  enum?: string[];
}

interface ParameterTableProps {
  parameters: Parameter[];
  title?: string;
  className?: string;
}

export default function ParameterTable({
  parameters,
  title = 'Parameters',
  className,
}: ParameterTableProps) {
  if (!parameters || parameters.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="parameter-table">
      <h4 className="text-lg font-semibold">{title}</h4>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parameters.map((param, index) => (
              <TableRow key={index} data-testid={`param-row-${param.name}`}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-semibold">
                        {param.name}
                      </code>
                      {param.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    {param.default && (
                      <div className="text-xs text-muted-foreground">
                        Default: <code>{param.default}</code>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="outline" className="font-mono text-xs">
                      {param.type}
                    </Badge>
                    {param.enum && (
                      <div className="text-xs text-muted-foreground">
                        Enum
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <p className="text-sm">{param.description}</p>
                    {param.example && (
                      <div className="text-xs text-muted-foreground">
                        Example: <code className="bg-muted px-1 py-0.5 rounded">
                          {param.example}
                        </code>
                      </div>
                    )}
                    {param.enum && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Possible values: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {param.enum.map((value, i) => (
                            <code
                              key={i}
                              className="bg-muted px-1 py-0.5 rounded text-xs"
                            >
                              {value}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}