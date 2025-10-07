import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MessageCircle,
  Send,
  Plus,
  Settings,
  Bot,
  User,
  Building,
  Users,
  BookOpen,
  Trash2,
  Edit,
  Coins,
  AlertCircle,
} from "lucide-react";
import { insertBusinessContextSchema, type BusinessContext, type Conversation, type ChatMessage, type User as UserType } from "@shared/schema";
import { Link } from "wouter";

interface ChatInterfaceProps {
  className?: string;
  enterpriseId?: string;
}

const businessContextFormSchema = insertBusinessContextSchema.omit({
  userId: true, // Exclude userId from form validation - it's added programmatically
}).extend({
  customerProfilesText: z.string().default(""),
  guidanceRulesText: z.string().default(""),
}).transform(data => ({
  ...data,
  companyName: data.companyName || "",
  website: data.website || "",
  description: data.description || "",
  awards: data.awards || "",
  outreachGoal: data.outreachGoal || "",
}));

type BusinessContextFormData = z.infer<typeof businessContextFormSchema>;

export default function ChatInterface({ className = "", enterpriseId }: ChatInterfaceProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isBusinessContextOpen, setIsBusinessContextOpen] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const businessContextForm = useForm<BusinessContextFormData>({
    resolver: zodResolver(businessContextFormSchema),
    defaultValues: {
      companyName: "",
      website: "",
      description: "",
      awards: "",
      outreachGoal: "",
      customerProfilesText: "",
      guidanceRulesText: "",
    },
  });

  // Fetch conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: enterpriseId 
      ? ["/api/crm", enterpriseId, "ai", "conversations"]
      : ["/api/crm/ai/conversations"],
    enabled: !!user && !!(user as UserType)?.id,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: enterpriseId
      ? ["/api/crm", enterpriseId, "ai", "conversations", selectedConversation, "messages"]
      : ["/api/crm/ai/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
  });

  // Fetch business context
  const { data: businessContext } = useQuery<BusinessContext>({
    queryKey: enterpriseId
      ? ["/api/crm", enterpriseId, "ai", "business-context"]
      : ["/api/crm/ai/business-context"],
    enabled: !!user && !!(user as UserType)?.id,
  });

  // Update form when business context loads
  useEffect(() => {
    if (businessContext) {
      businessContextForm.reset({
        companyName: businessContext.companyName || "",
        website: businessContext.website || "",
        description: businessContext.description || "",
        awards: businessContext.awards || "",
        outreachGoal: businessContext.outreachGoal || "",
        customerProfilesText: businessContext.customerProfiles ? JSON.stringify(businessContext.customerProfiles, null, 2) : "",
        guidanceRulesText: Array.isArray(businessContext.guidanceRules) ? businessContext.guidanceRules.join('\n') : "",
      });
    }
  }, [businessContext, businessContextForm]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Define chat response type for better type safety
  type ChatResponse = {
    conversation: Conversation;
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
    response: string;
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; conversationId?: string }): Promise<ChatResponse> => {
      const url = enterpriseId 
        ? `/api/crm/${enterpriseId}/ai/chat`
        : "/api/crm/ai/chat";
      const response = await apiRequest("POST", url, data);
      return await response.json();
    },
    onSuccess: (result: ChatResponse) => {
      console.log("Chat API response:", result);
      
      // Validate response structure
      if (!result || typeof result !== 'object') {
        console.error("Invalid response structure:", result);
        toast({
          title: "Error",
          description: "Invalid response from server",
          variant: "destructive",
        });
        return;
      }

      // Validate conversation object
      if (!result.conversation || !result.conversation.id) {
        console.error("Missing conversation in response:", result);
        toast({
          title: "Error",
          description: "Invalid conversation data received",
          variant: "destructive",
        });
        return;
      }

      // All validations passed - update state
      console.log("Successfully processed chat response, conversation ID:", result.conversation.id);
      setMessageInput("");
      setSelectedConversation(result.conversation.id);
      setIsNewChat(false);
      
      // Refresh data
      refetchConversations();
      refetchMessages();
      
      // Show success feedback
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    },
    onError: (error: any) => {
      console.error("Chat mutation error:", error);
      const errorMessage = error?.message || "Failed to send message";
      const isInsufficientCredits = errorMessage.includes("Insufficient") || errorMessage.includes("credits");
      
      if (isInsufficientCredits) {
        toast({
          title: "Insufficient AI Credits",
          description: (
            <div className="flex flex-col gap-2">
              <p>You don't have enough credits to send this message.</p>
              <Button 
                size="sm" 
                variant="outline" 
                asChild
                className="w-full"
              >
                <Link href="/pricing">
                  <Coins className="w-4 h-4 mr-2" />
                  Buy Credits
                </Link>
              </Button>
            </div>
          ),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  // Update business context mutation
  const updateBusinessContextMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = enterpriseId
        ? `/api/crm/${enterpriseId}/ai/business-context`
        : "/api/crm/ai/business-context";
      return apiRequest("POST", url, data);
    },
    onSuccess: () => {
      const queryKey = enterpriseId
        ? ["/api/crm", enterpriseId, "ai", "business-context"]
        : ["/api/crm/ai/business-context"];
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Success",
        description: "Business context updated successfully",
      });
      setIsBusinessContextOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update business context",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    sendMessageMutation.mutate({
      message: messageInput,
      conversationId: isNewChat ? undefined : selectedConversation || undefined,
    });
  };

  const handleNewChat = () => {
    setSelectedConversation(null);
    setIsNewChat(true);
    setMessageInput("");
  };

  const handleBusinessContextSubmit = (data: BusinessContextFormData) => {
    console.log("Form submission triggered!", data);
    console.log("Authentication status:", { isAuthenticated, userId: (user as UserType)?.id });
    
    if (!isAuthenticated || !(user as UserType)?.id) {
      console.error("Authentication failed - user not authenticated");
      toast({
        title: "Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    const processedData = {
      ...data,
      userId: (user as UserType).id,
      customerProfiles: data.customerProfilesText ? (() => {
        try {
          return JSON.parse(data.customerProfilesText);
        } catch {
          return [];
        }
      })() : [],
      guidanceRules: data.guidanceRulesText ? data.guidanceRulesText.split('\n').filter(Boolean) : [],
    };

    console.log("Submitting business context:", processedData);
    updateBusinessContextMutation.mutate(processedData);
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  const renderExternalSearchResults = (metadata: any): React.ReactNode | null => {
    if (!metadata?.functionCall?.result?.data) return null;
    
    const { name: functionName, result } = metadata.functionCall;
    if (!['searchApollo', 'searchGoogleMaps', 'searchFoursquare'].includes(functionName)) {
      return null;
    }

    const results = result.data || [];
    if (results.length === 0) return null;

    const providerInfo: Record<string, { name: string; icon: string; variant: "default" | "secondary" | "outline" }> = {
      'searchApollo': { name: 'Apollo.io', icon: '🔍', variant: 'default' },
      'searchGoogleMaps': { name: 'Google Maps', icon: '📍', variant: 'default' },
      'searchFoursquare': { name: 'Foursquare', icon: '🗺️', variant: 'default' }
    };

    const provider = providerInfo[functionName] || { name: result.source, icon: '📥', variant: 'outline' as const };
    const isMockData = result.usingMockData;

    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <Badge variant={isMockData ? "outline" : provider.variant} className="text-xs">
            {isMockData ? '🧪 Mock Data' : `${provider.icon} ${provider.name}`}
          </Badge>
          <span className="text-muted-foreground">{results.length} result{results.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.slice(0, 5).map((item: any, idx: number) => (
            <Card key={idx} className="p-3 bg-background/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {item.name || item.company || 'Unknown'}
                  </div>
                  {(item.location || item.address) && (
                    <div className="text-xs text-muted-foreground truncate">
                      📍 {item.location || item.address}
                    </div>
                  )}
                  {item.email && (
                    <div className="text-xs text-muted-foreground truncate">
                      ✉️ {item.email}
                    </div>
                  )}
                  {item.website && (
                    <div className="text-xs text-muted-foreground truncate">
                      🌐 {item.website}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-[600px] border rounded-lg overflow-hidden ${className}`}>
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/20 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">EarthCare Copilot</h3>
            </div>
            <Dialog open={isBusinessContextOpen} onOpenChange={setIsBusinessContextOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-business-context">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Business Context & Memory</DialogTitle>
                </DialogHeader>
                <Form {...businessContextForm}>
                  <form onSubmit={businessContextForm.handleSubmit(handleBusinessContextSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={businessContextForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your company name" {...field} data-testid="input-company-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={businessContextForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://your-website.com" {...field} data-testid="input-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={businessContextForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your regenerative enterprise mission and activities..."
                              className="min-h-[80px]"
                              {...field}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={businessContextForm.control}
                      name="outreachGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outreach Goal</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What are your primary outreach and networking goals?"
                              className="min-h-[60px]"
                              {...field}
                              data-testid="textarea-outreach-goal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={businessContextForm.control}
                      name="customerProfilesText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Profiles (JSON)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='[{"name": "Regenerative Farmers", "description": "Small-scale farmers transitioning to regenerative practices"}]'
                              className="min-h-[80px] font-mono text-sm"
                              {...field}
                              data-testid="textarea-customer-profiles"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={businessContextForm.control}
                      name="guidanceRulesText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guidance Rules (one per line)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Always prioritize environmental impact&#10;Focus on long-term sustainability&#10;Consider community benefits"
                              className="min-h-[80px]"
                              {...field}
                              data-testid="textarea-guidance-rules"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsBusinessContextOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateBusinessContextMutation.isPending} 
                        data-testid="button-save-context"
                        onClick={() => {
                          console.log("Save Context button clicked!");
                          console.log("Form state:", businessContextForm.formState);
                          console.log("Form errors:", businessContextForm.formState.errors);
                          console.log("Form values:", businessContextForm.getValues());
                        }}
                      >
                        {updateBusinessContextMutation.isPending ? "Saving..." : "Save Context"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <Button 
            onClick={handleNewChat} 
            className="w-full" 
            variant="outline" 
            size="sm"
            data-testid="button-new-chat"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {conversations.map((conversation: Conversation) => (
              <Card
                key={conversation.id}
                className={`cursor-pointer border transition-colors ${
                  selectedConversation === conversation.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setSelectedConversation(conversation.id);
                  setIsNewChat(false);
                }}
                data-testid={`conversation-${conversation.id}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conversation.title || "New Conversation"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Memory Stats */}
        <div className="p-4 border-t bg-muted/10">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span>Conversations</span>
              <Badge variant="secondary" className="text-xs">
                {conversations.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Context Set</span>
              <Badge variant={businessContext?.companyName ? "default" : "outline"} className="text-xs">
                {businessContext?.companyName ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {(selectedConversation || isNewChat) && (
          <div className="p-4 border-b bg-background">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-primary" />
              <h4 className="font-medium">
                {isNewChat ? "New Conversation" : conversations.find(c => c.id === selectedConversation)?.title || "Chat"}
              </h4>
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {selectedConversation && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message: ChatMessage) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">
                        {formatMessage(message.content)}
                      </div>
                      {message.role === 'assistant' && message.metadata && renderExternalSearchResults(message.metadata as any)}
                      <div className="text-xs opacity-70 mt-1">
                        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="flex space-x-2 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : isNewChat || selectedConversation ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-2">
                <Bot className="w-12 h-12 text-muted-foreground mx-auto" />
                <h4 className="text-lg font-medium">Start a conversation</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Ask me anything about regenerative enterprises, sustainability, or CRM management
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-4">
                <Bot className="w-16 h-16 text-muted-foreground mx-auto" />
                <h4 className="text-xl font-medium">Welcome to EarthCare Copilot</h4>
                <p className="text-muted-foreground max-w-md">
                  Select a conversation or start a new chat to begin getting AI-powered insights for your regenerative enterprise
                </p>
                <Button onClick={handleNewChat} data-testid="button-start-chat">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Message Input */}
        {(selectedConversation || isNewChat) && (
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Ask EarthCare Copilot..."
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={sendMessageMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}