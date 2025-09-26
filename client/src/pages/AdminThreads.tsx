import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDateCDT } from '@/lib/timezone';
import { 
  ArrowLeft, 
  MessageSquare, 
  CheckCircle, 
  Ban, 
  AlertCircle,
  Clock,
  User,
  Filter
} from 'lucide-react';

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
  messageCount: number;
  lastMessage?: {
    content: string;
    isFromAdmin: boolean;
    createdAt: string;
  };
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "open":
      return { icon: MessageSquare, color: "bg-blue-500", label: "Open", textColor: "text-blue-600 dark:text-blue-400" };
    case "resolved":
      return { icon: CheckCircle, color: "bg-green-500", label: "Resolved", textColor: "text-green-600 dark:text-green-400" };
    case "blocked":
      return { icon: Ban, color: "bg-red-500", label: "Blocked", textColor: "text-red-600 dark:text-red-400" };
    default:
      return { icon: AlertCircle, color: "bg-gray-500", label: "Unknown", textColor: "text-gray-600 dark:text-gray-400" };
  }
};

export default function AdminThreads() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [threads, setThreads] = useState<AdminMessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setLocation('/admin/login');
      return;
    }
    
    fetchThreads();
  }, [setLocation]);

  const fetchThreads = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/threads', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      } else if (response.status === 401) {
        toast({
          title: 'Access Denied',
          description: 'Please log in again.',
          variant: 'destructive',
        });
        setLocation('/admin/login');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load message threads.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateThreadStatus = async (threadId: string, status: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/threads/${threadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: 'Thread Updated',
          description: `Thread status changed to ${status}.`,
        });
        fetchThreads(); // Refresh the list
      } else {
        throw new Error('Failed to update thread');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update thread status.',
        variant: 'destructive',
      });
    }
  };

  const filteredAndSortedThreads = () => {
    let filtered = threads;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(thread => thread.status === filterStatus);
    }
    
    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime();
        case 'oldest':
          return new Date(a.lastMessageAt || a.createdAt).getTime() - new Date(b.lastMessageAt || b.createdAt).getTime();
        case 'unread':
          return Number(b.unreadByAdmin) - Number(a.unreadByAdmin);
        default:
          return 0;
      }
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDateCDT(dateString);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading message threads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/admin/dashboard')}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Message Threads</h1>
                <p className="text-sm text-muted-foreground">Manage user conversations and support requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filters and Stats */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Threads</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="unread">Unread First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground justify-center sm:justify-end">
              <span data-testid="text-total-threads">Total: {threads.length}</span>
              <span data-testid="text-unread-threads">Unread: {threads.filter(t => t.unreadByAdmin).length}</span>
            </div>
          </div>
        </div>

        {/* Threads List */}
        <div className="space-y-4">
          {filteredAndSortedThreads().length > 0 ? (
            filteredAndSortedThreads().map((thread) => {
              const statusInfo = getStatusInfo(thread.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={thread.id} className="hover-elevate transition-all duration-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 
                            className="font-semibold text-lg truncate"
                            data-testid={`thread-subject-${thread.id}`}
                          >
                            {thread.subject}
                          </h3>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {thread.unreadByAdmin && (
                              <Badge 
                                variant="destructive" 
                                className="h-5 px-2 text-xs"
                                data-testid={`badge-unread-admin-${thread.id}`}
                              >
                                Unread
                              </Badge>
                            )}
                            
                            <div className={`flex items-center gap-1 ${statusInfo.textColor}`}>
                              <StatusIcon className="w-4 h-4" />
                              <span className="text-xs font-medium">
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <User className="w-4 h-4" />
                          <span data-testid={`thread-user-${thread.id}`}>
                            {thread.userDisplayName} ({thread.userEmail})
                          </span>
                        </div>
                        
                        {thread.lastMessage && (
                          <p 
                            className="text-sm text-muted-foreground mb-3 line-clamp-2"
                            data-testid={`thread-preview-${thread.id}`}
                          >
                            <span className="font-medium">
                              {thread.lastMessage.isFromAdmin ? "Admin: " : "User: "}
                            </span>
                            {thread.lastMessage.content}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span data-testid={`thread-time-${thread.id}`}>
                              {formatTimeAgo(thread.lastMessageAt || thread.createdAt)}
                            </span>
                          </div>
                          <span data-testid={`thread-message-count-${thread.id}`}>
                            {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          className="flex-1 sm:flex-initial"
                          onClick={() => setLocation(`/admin/threads/${thread.id}`)}
                          data-testid={`button-view-thread-${thread.id}`}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">View & Reply</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                        
                        <Select 
                          value={thread.status} 
                          onValueChange={(value) => updateThreadStatus(thread.id, value)}
                        >
                          <SelectTrigger 
                            className="w-full sm:w-32 h-9 sm:h-8 text-sm sm:text-xs"
                            data-testid={`select-thread-status-${thread.id}`}
                          >
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
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No message threads found</h3>
                <p className="text-muted-foreground">
                  {filterStatus === 'all' 
                    ? "No users have sent any messages yet." 
                    : `No ${filterStatus} threads found.`
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}