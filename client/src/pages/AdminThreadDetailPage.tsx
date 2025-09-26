import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  CheckCircle, 
  Ban, 
  AlertCircle,
  User,
  Clock,
  Shield
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isFromAdmin: boolean;
  senderUser?: {
    displayName: string;
  };
}

interface AdminMessageThread {
  id: string;
  subject: string;
  status: "open" | "resolved" | "blocked";
  unreadByUser: boolean;
  unreadByAdmin: boolean;
  createdAt: string;
  lastMessageAt: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
}

interface AdminThreadDetailPageProps {
  threadId: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "open":
      return { icon: MessageSquare, color: "bg-blue-500", label: "Open", description: "Active conversation" };
    case "resolved":
      return { icon: CheckCircle, color: "bg-green-500", label: "Resolved", description: "Issue has been resolved" };
    case "blocked":
      return { icon: Ban, color: "bg-red-500", label: "Blocked", description: "User is blocked from replying" };
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

export default function AdminThreadDetailPage({ threadId }: AdminThreadDetailPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [replyContent, setReplyContent] = useState("");

  // Use regular authentication with credentials
  const getAuthHeaders = () => {
    return { 
      'Content-Type': 'application/json'
    };
  };

  // Fetch thread details (admin view)
  const { data: thread, isLoading: threadLoading, error: threadError } = useQuery<AdminMessageThread>({
    queryKey: ["admin-thread", threadId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/threads/${threadId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch thread');
      }
      return response.json();
    },
    staleTime: 30000,
  });

  // Fetch thread messages
  const { data: messages, isLoading: messagesLoading, error: messagesError } = useQuery<Message[]>({
    queryKey: ["admin-thread", threadId, "messages"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/threads/${threadId}/messages`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    staleTime: 10000,
  });

  // Admin reply mutation
  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/admin/threads/${threadId}/messages`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        throw new Error('Failed to send reply');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reply sent",
        description: "Your admin reply has been sent to the user.",
      });
      
      setReplyContent("");
      
      // Invalidate queries to refresh the conversation
      queryClient.invalidateQueries({ queryKey: ["admin-thread", threadId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-thread", threadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/threads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send reply",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/admin/threads/${threadId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      return response.json();
    },
    onSuccess: (data, status) => {
      toast({
        title: "Thread updated",
        description: `Thread status changed to ${status}.`,
      });
      
      // Invalidate queries to refresh
      queryClient.invalidateQueries({ queryKey: ["admin-thread", threadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/threads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update thread",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim()) {
      replyMutation.mutate(replyContent.trim());
    }
  };

  const handleStatusChange = (newStatus: string) => {
    statusMutation.mutate(newStatus);
  };

  if (threadLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (threadError || messagesError || !thread) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">Thread Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The conversation you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => setLocation("/admin/threads")} data-testid="button-back-to-threads">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Threads
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(thread.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/admin/threads')}
                data-testid="button-back-to-threads"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Threads</span>
                <span className="sm:hidden">Back</span>
              </Button>
              
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold truncate" data-testid="thread-subject">
                  {thread.subject}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span data-testid="thread-user">
                    {thread.userDisplayName} ({thread.userEmail})
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${statusInfo.color} text-white`}>
                <StatusIcon className="w-4 h-4" />
                <span className="text-xs font-medium" data-testid="thread-status">
                  {statusInfo.label}
                </span>
              </div>
              
              <Select 
                value={thread.status} 
                onValueChange={handleStatusChange}
                disabled={statusMutation.isPending}
              >
                <SelectTrigger className="w-32" data-testid="select-thread-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Messages */}
        <div className="space-y-4 mb-6">
          {messages?.map((message) => (
            <Card key={message.id} className={message.isFromAdmin ? "border-l-4 border-l-blue-500" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {message.isFromAdmin ? (
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {message.isFromAdmin ? "Admin" : thread.userDisplayName}
                      </p>
                      {message.isFromAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          Support Team
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span data-testid={`message-time-${message.id}`}>
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="pl-10">
                  <p className="text-sm whitespace-pre-wrap" data-testid={`message-content-${message.id}`}>
                    {message.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Reply Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Admin Reply
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReply} className="space-y-4">
              <div>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your admin response..."
                  rows={4}
                  maxLength={2000}
                  disabled={replyMutation.isPending}
                  data-testid="textarea-admin-reply"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {replyContent.length}/2000 characters
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Your reply will be sent as an admin response and will mark the thread as read.
                </p>
                <Button
                  type="submit"
                  disabled={!replyContent.trim() || replyMutation.isPending}
                  data-testid="button-send-admin-reply"
                >
                  {replyMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Admin Reply
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}