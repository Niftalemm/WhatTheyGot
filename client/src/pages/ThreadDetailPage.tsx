import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, MessageSquare, CheckCircle, AlertCircle, Ban, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isFromAdmin: boolean;
  senderUser?: {
    displayName: string;
  };
}

interface MessageThread {
  id: string;
  subject: string;
  status: "open" | "resolved" | "blocked";
  unreadByUser: boolean;
  createdAt: string;
  lastMessageAt: string;
}

interface ThreadDetailPageProps {
  threadId: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "open":
      return { icon: MessageSquare, color: "bg-blue-500", label: "Open", description: "You can reply to this conversation" };
    case "resolved":
      return { icon: CheckCircle, color: "bg-green-500", label: "Resolved", description: "This issue has been resolved. Replying will reopen it." };
    case "blocked":
      return { icon: Ban, color: "bg-red-500", label: "Blocked", description: "You cannot reply to this conversation" };
    default:
      return { icon: AlertCircle, color: "bg-gray-500", label: "Unknown", description: "" };
  }
};

const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ThreadDetailPage({ threadId }: ThreadDetailPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [replyContent, setReplyContent] = useState("");

  // Fetch thread details
  const { data: thread, isLoading: threadLoading, error: threadError } = useQuery<MessageThread>({
    queryKey: ["/api/threads", threadId],
    staleTime: 30000,
  });

  // Fetch thread messages
  const { data: messages, isLoading: messagesLoading, error: messagesError } = useQuery<Message[]>({
    queryKey: ["/api/threads", threadId, "messages"],
    staleTime: 10000,
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", `/api/threads/${threadId}/messages`, { content }),
    onSuccess: (data) => {
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully.",
      });
      
      setReplyContent("");
      
      // Invalidate queries to refresh the conversation
      queryClient.invalidateQueries({ queryKey: ["/api/threads", threadId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/threads", threadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send reply",
        description: error.error || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      toast({
        title: "Please enter a message",
        description: "Reply content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (replyContent.length > 2000) {
      toast({
        title: "Message too long",
        description: "Message must be 2000 characters or less",
        variant: "destructive",
      });
      return;
    }

    replyMutation.mutate(replyContent.trim());
  };

  const goBack = () => {
    setLocation("/profile");
  };

  if (threadLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (threadError || messagesError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <p className="text-lg font-medium">Thread not found</p>
            <p className="text-muted-foreground mb-4">This conversation may have been deleted or you don't have access to it.</p>
            <Button onClick={goBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!thread || !messages) {
    return null;
  }

  const statusInfo = getStatusInfo(thread.status);
  const StatusIcon = statusInfo.icon;
  const canReply = thread.status !== "blocked";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-4 px-4 z-10 border-b border-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={goBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold truncate" data-testid="text-thread-subject">
              {thread.subject}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <StatusIcon className={`w-4 h-4 text-white rounded-full p-0.5 ${statusInfo.color}`} />
              <span>{statusInfo.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Info */}
        {statusInfo.description && (
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            {statusInfo.description}
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((message) => (
            <Card 
              key={message.id} 
              className={`${message.isFromAdmin ? 'ml-4' : 'mr-4'}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-sm">
                      {message.isFromAdmin ? "S" : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {message.isFromAdmin ? "Support Team" : (message.senderUser?.displayName || "You")}
                      </span>
                      {message.isFromAdmin && (
                        <Badge variant="secondary" className="h-5 px-2 text-xs">
                          Staff
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm mb-2 whitespace-pre-wrap" data-testid={`message-content-${message.id}`}>
                      {message.content}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span data-testid={`message-time-${message.id}`}>
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reply Form */}
        {canReply ? (
          <Card>
            <CardContent className="pt-4">
              <form onSubmit={handleReply} className="space-y-4">
                <div>
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={thread.status === "resolved" ? "Type your reply to reopen this conversation..." : "Type your reply..."}
                    rows={4}
                    maxLength={2000}
                    disabled={replyMutation.isPending}
                    data-testid="textarea-reply"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {replyContent.length}/2000 characters
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={!replyContent.trim() || replyMutation.isPending}
                  data-testid="button-send-reply"
                >
                  {replyMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {thread.status === "resolved" ? "Reopen & Reply" : "Send Reply"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <div className="text-center py-6 text-muted-foreground">
                <Ban className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">Reply Disabled</p>
                <p className="text-sm">You cannot reply to this conversation.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}