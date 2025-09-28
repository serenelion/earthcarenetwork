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
} from "lucide-react";
import { insertBusinessContextSchema, type BusinessContext, type Conversation, type ChatMessage } from "@shared/schema";

interface ChatInterfaceProps {
  className?: string;
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

export default function ChatInterface({ className = "" }: ChatInterfaceProps) {
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
    queryKey: ["/api/crm/ai/conversations"],
    enabled: !!user?.id,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: [`/api/crm/ai/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation,
  });

  // Fetch business context
  const { data: businessContext } = useQuery<BusinessContext>({
    queryKey: ["/api/crm/ai/business-context"],
    enabled: !!user?.id,
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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; conversationId?: string }) => {
      return apiRequest("POST", "/api/crm/ai/chat", data);
    },
    onSuccess: (result: any) => {
      setMessageInput("");
      setSelectedConversation(result.conversation.id);
      setIsNewChat(false);
      refetchConversations();
      refetchMessages();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Update business context mutation
  const updateBusinessContextMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/crm/ai/business-context", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/ai/business-context"] });
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
    console.log("Authentication status:", { isAuthenticated, userId: user?.id });
    
    if (!isAuthenticated || !user?.id) {
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
      userId: user.id,
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