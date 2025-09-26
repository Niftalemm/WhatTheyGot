import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, CheckCircle, AlertCircle, Ban } from "lucide-react";
import { Link } from "wouter";

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
  lastMessage?: Message;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "open":
      return { icon: MessageSquare, color: "bg-blue-500", label: "Open" };
    case "resolved":
      return { icon: CheckCircle, color: "bg-green-500", label: "Resolved" };
    case "blocked":
      return { icon: Ban, color: "bg-red-500", label: "Blocked" };
    default:
      return { icon: AlertCircle, color: "bg-gray-500", label: "Unknown" };
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

export default function MessageThreadsList() {
  const { data: threads, isLoading, error } = useQuery<MessageThread[]>({
    queryKey: ["/api/threads"],
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="h-5 w-12 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
        <p>Failed to load messages</p>
        <p className="text-sm">Please try again later</p>
      </div>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <MessageSquare className="w-8 h-8 mx-auto mb-2" />
        <p>No messages yet</p>
        <p className="text-sm">Click "New Message" to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread) => {
        const statusInfo = getStatusInfo(thread.status);
        const StatusIcon = statusInfo.icon;
        
        return (
          <Link key={thread.id} to={`/messages/${thread.id}`}>
            <Button
              variant="ghost"
              className="w-full h-auto p-4 justify-start hover-elevate text-left"
              data-testid={`button-thread-${thread.id}`}
            >
              <div className="flex items-start justify-between gap-3 w-full">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 
                      className="font-medium truncate"
                      data-testid={`thread-subject-${thread.id}`}
                    >
                      {thread.subject}
                    </h3>
                    {thread.unreadByUser && (
                      <Badge 
                        variant="default" 
                        className="h-5 px-2 text-xs"
                        data-testid={`badge-unread-${thread.id}`}
                      >
                        New
                      </Badge>
                    )}
                  </div>
                  
                  {thread.lastMessage && (
                    <p 
                      className="text-sm text-muted-foreground truncate mb-2"
                      data-testid={`thread-preview-${thread.id}`}
                    >
                      {thread.lastMessage.isFromAdmin ? "Support: " : "You: "}
                      {thread.lastMessage.content}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span data-testid={`thread-time-${thread.id}`}>
                      {formatTimeAgo(thread.lastMessageAt || thread.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    <StatusIcon 
                      className={`w-4 h-4 text-white rounded-full p-0.5 ${statusInfo.color}`}
                      data-testid={`thread-status-icon-${thread.id}`}
                    />
                    <span 
                      className="text-xs text-muted-foreground"
                      data-testid={`thread-status-${thread.id}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}