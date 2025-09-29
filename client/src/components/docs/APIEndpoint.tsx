import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import HTTPMethodBadge from './HTTPMethodBadge';
import ParameterTable from './ParameterTable';
import LanguageTabs from './LanguageTabs';
import { cn } from '@/lib/utils';
import { Anchor } from 'lucide-react';

interface Parameter {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  default?: string;
  example?: string;
  enum?: string[];
}

interface ResponseExample {
  status: number;
  description: string;
  example: object;
}

interface LanguageExample {
  language: string;
  label: string;
  code: string;
  fileName?: string;
}

interface APIEndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  title: string;
  description: string;
  parameters?: Parameter[];
  queryParameters?: Parameter[];
  bodyParameters?: Parameter[];
  responses?: ResponseExample[];
  examples?: LanguageExample[];
  requiresAuth?: boolean;
  roles?: string[];
  className?: string;
  id?: string;
}

export default function APIEndpoint({
  method,
  path,
  title,
  description,
  parameters,
  queryParameters,
  bodyParameters,
  responses,
  examples,
  requiresAuth = false,
  roles,
  className,
  id,
}: APIEndpointProps) {
  const endpointId = id || `${method.toLowerCase()}-${path.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <div className={cn('space-y-6', className)} id={endpointId} data-testid={`api-endpoint-${endpointId}`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <a href={`#${endpointId}`} className="flex items-center gap-2 group">
            <Anchor className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-xl font-semibold">{title}</h3>
          </a>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <HTTPMethodBadge method={method} />
          <code className="bg-muted px-3 py-1 rounded-md font-mono text-sm">
            {path}
          </code>
          {requiresAuth && (
            <Badge variant="secondary">
              🔒 Authentication Required
            </Badge>
          )}
          {roles && roles.length > 0 && (
            <Badge variant="outline">
              Roles: {roles.join(', ')}
            </Badge>
          )}
        </div>
        
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Parameters */}
      <div className="space-y-6">
        {parameters && parameters.length > 0 && (
          <ParameterTable parameters={parameters} title="Path Parameters" />
        )}
        
        {queryParameters && queryParameters.length > 0 && (
          <ParameterTable parameters={queryParameters} title="Query Parameters" />
        )}
        
        {bodyParameters && bodyParameters.length > 0 && (
          <ParameterTable parameters={bodyParameters} title="Request Body" />
        )}
      </div>

      {/* Examples */}
      {examples && examples.length > 0 && (
        <LanguageTabs examples={examples} title="Code Examples" />
      )}

      {/* Responses */}
      {responses && responses.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Responses</h4>
          <div className="space-y-4">
            {responses.map((response, index) => (
              <Card key={index} data-testid={`response-${response.status}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={response.status < 300 ? 'default' : response.status < 400 ? 'secondary' : 'destructive'}
                      className="font-mono"
                    >
                      {response.status}
                    </Badge>
                    <span className="font-medium">{response.description}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 border rounded-lg p-4">
                    <pre className="text-sm font-mono overflow-x-auto">
                      <code className="language-json">
                        {JSON.stringify(response.example, null, 2)}
                      </code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}