import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useAIChat,
  useAIChatHistory,
  useClearHistory,
  useAITools,
  type AIMessage,
  type AITool,
} from "@/lib/admin-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  Send,
  Trash2,
  Wrench,
  Bot,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AIChat() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string>("admin-chat-session");
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useAIChat();
  const { data: historyData, isLoading: isLoadingHistory } = useAIChatHistory(conversationId);
  const clearMutation = useClearHistory();
  const { data: toolsData, isLoading: isLoadingTools } = useAITools();

  const tools = toolsData?.tools || [];

  useEffect(() => {
    if (historyData?.messages) {
      setMessages(historyData.messages);
    }
  }, [historyData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: AIMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsStreaming(true);

    try {
      const response: any = await chatMutation.mutateAsync({
        message: message,
        conversationId,
      });

      const assistantMessage: AIMessage = {
        role: "assistant",
        content: response.content || "No response",
        timestamp: new Date().toISOString(),
        toolCalls: response.toolCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.conversationId && response.conversationId !== conversationId) {
        setConversationId(response.conversationId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });

      const errorMessage: AIMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearMutation.mutateAsync(conversationId);
      setMessages([]);
      setIsClearDialogOpen(false);
      toast({
        title: "Success",
        description: "Chat history cleared",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear history",
        variant: "destructive",
      });
    }
  };

  const renderToolCall = (toolCall: any) => {
    return (
      <div className="mt-2 p-3 bg-muted/50 rounded-lg border" data-testid={`tool-call-${toolCall.name}`}>
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Tool: {toolCall.name}</span>
        </div>
        {toolCall.arguments && (
          <div className="text-xs text-muted-foreground mb-2">
            <span className="font-medium">Arguments:</span>
            <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>
        )}
        {toolCall.result && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Result:</span>
            <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
              {typeof toolCall.result === "string"
                ? toolCall.result
                : JSON.stringify(toolCall.result, null, 2)}
            </pre>
          </div>
        )}
        {toolCall.error && (
          <div className="text-xs text-destructive">
            <span className="font-medium">Error:</span> {toolCall.error}
          </div>
        )}
      </div>
    );
  };

  const renderMessage = (msg: AIMessage, index: number) => {
    const isUser = msg.role === "user";

    return (
      <div
        key={index}
        className={cn(
          "flex gap-3 p-4",
          isUser ? "justify-end" : "justify-start"
        )}
        data-testid={`message-${index}`}
      >
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        )}

        <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start", "max-w-[80%]")}>
          <div
            className={cn(
              "rounded-lg px-4 py-2",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          </div>

          {msg.toolCalls && msg.toolCalls.length > 0 && (
            <div className="w-full space-y-2">
              {msg.toolCalls.map((toolCall, idx) => (
                <div key={idx}>{renderToolCall(toolCall)}</div>
              ))}
            </div>
          )}

          {msg.timestamp && (
            <span className="text-xs text-muted-foreground">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        {isUser && (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-5 w-5 text-secondary-foreground" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6" data-testid="ai-chat-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            AI Chat Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Chat with the AI agent and monitor tool usage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-view-tools">
                <Wrench className="h-4 w-4 mr-2" />
                Available Tools ({tools.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Available AI Tools</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-96">
                <div className="space-y-4">
                  {isLoadingTools ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))
                  ) : tools.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No tools available</p>
                  ) : (
                    tools.map((tool, idx) => (
                      <Card key={idx} data-testid={`tool-card-${tool.name}`}>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            {tool.name}
                            {tool.stats && (
                              <Badge variant="secondary" className="ml-auto">
                                Used: {tool.stats.usageCount}
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">
                            {tool.description}
                          </p>
                          {tool.parameters && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View Parameters
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                                {JSON.stringify(tool.parameters, null, 2)}
                              </pre>
                            </details>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Button
            variant="destructive"
            onClick={() => setIsClearDialogOpen(true)}
            disabled={clearMutation.isPending || messages.length === 0}
            data-testid="button-clear-history"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Chat Messages</CardTitle>
              <Badge variant="secondary" data-testid="message-count">
                {messages.length} messages
              </Badge>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {isLoadingHistory ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No messages yet. Start a conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((msg, idx) => renderMessage(msg, idx))}
                {isStreaming && (
                  <div className="flex gap-3 p-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isStreaming}
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isStreaming}
                data-testid="button-send-message"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      </div>

      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all chat messages? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-clear">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-clear"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
