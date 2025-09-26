import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Star, MessageSquare, Camera, TrendingUp, AlertCircle, Info, Warning, BarChart3, Bell } from "lucide-react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'alert' | 'info' | 'warning' | 'poll';
  isActive: boolean;
  showOn: string[];
  pollQuestion?: string;
  pollOptions?: string[];
  resultsRevealed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Query to get active messages for home page
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['home-messages'],
    queryFn: () => fetch('/api/messages/active?showOn=all,home').then(res => res.json()),
  });

  // Poll voting component for Home page
  const HomePollDisplay = ({ message }: { message: Message }) => {
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string>('');

    // Query to get poll results and check if user voted
    const { data: pollResults, refetch: refetchResults } = useQuery({
      queryKey: ['poll-results', message.id],
      queryFn: async () => {
        const response = await fetch(`/api/polls/${message.id}/results`);
        const data = await response.json();
        
        // Check if user has already voted
        const voteResponse = await fetch(`/api/polls/${message.id}/user-vote`);
        if (voteResponse.ok) {
          const voteData = await voteResponse.json();
          if (voteData.hasVoted) {
            setHasVoted(true);
            setSelectedOption(voteData.optionId);
          }
        }
        
        return data;
      },
      enabled: message.type === 'poll',
      refetchInterval: 3000, // Always poll for results to keep them fresh
    });

    // Voting mutation
    const voteMutation = useMutation({
      mutationFn: async (optionId: string) => {
        return apiRequest('POST', `/api/polls/${message.id}/vote`, { optionId });
      },
      onSuccess: () => {
        setHasVoted(true);
        refetchResults();
        toast({
          title: 'Vote Recorded!',
          description: 'Your vote has been counted. You can change it anytime before results are revealed.',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to record vote. Please try again.',
          variant: 'destructive',
        });
      }
    });

    const handleVote = () => {
      if (selectedOption) {
        voteMutation.mutate(selectedOption);
      }
    };

    const totalVotes = pollResults?.results?.reduce((sum: number, result: any) => sum + result.voteCount, 0) || 0;

    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-medium text-green-700 dark:text-green-300 mb-3 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            {message.pollQuestion}
          </h4>
          
          {message.resultsRevealed ? (
            <div className="space-y-2">
              <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                Poll Results ({totalVotes} votes)
              </p>
              {pollResults?.results?.map((result: any) => {
                const percentage = totalVotes > 0 ? Math.round((result.voteCount / totalVotes) * 100) : 0;
                return (
                  <div key={result.optionId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{result.optionText}</span>
                      <span className="text-green-600 dark:text-green-400">{percentage}% ({result.voteCount})</span>
                    </div>
                    <div className="h-2 bg-green-100 dark:bg-green-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {hasVoted && (
                <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                  ✓ You have voted on this poll. You can change your vote below.
                </p>
              )}
              {pollResults?.options?.map((option: any) => (
                <label key={option.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-green-100 dark:hover:bg-green-900">
                  <input
                    type="radio"
                    name={`poll-${message.id}`}
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="text-green-600"
                    data-testid={`radio-poll-option-${option.id}`}
                  />
                  <span className="text-sm">{option.optionText}</span>
                </label>
              ))}
              <Button 
                onClick={handleVote}
                disabled={!selectedOption || voteMutation.isPending}
                size="sm"
                className="mt-3 bg-green-600 hover:bg-green-700"
                data-testid="button-vote-poll"
              >
                {voteMutation.isPending ? 'Voting...' : hasVoted ? 'Change Vote' : 'Vote'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="w-4 h-4" />;
      case 'warning': return <Warning className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      case 'poll': return <BarChart3 className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'alert': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'info': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      case 'poll': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with user info and logout */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={localStorage.getItem('userProfileImage') || user?.profileImageUrl || ""} alt={getDisplayName()} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {getDisplayName()}!</h1>
              <p className="text-muted-foreground">Ready to explore campus dining?</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Messages & Announcements */}
        {!messagesLoading && messages && messages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Campus Updates
            </h2>
            <div className="space-y-4">
              {messages.map((message: Message) => (
                <Card key={message.id} className={`${getMessageColor(message.type)} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getMessageIcon(message.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm mb-1">{message.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{message.content}</p>
                        
                        {/* Display poll voting interface for poll messages */}
                        {message.type === 'poll' && (
                          <HomePollDisplay message={message} />
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(message.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Reviews Posted</p>
                  <p className="text-xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Photos Shared</p>
                  <p className="text-xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-xl font-bold">-</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Helpful Reports</p>
                  <p className="text-xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Navigation */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What would you like to do today?</CardTitle>
                <CardDescription>
                  Explore campus dining options and share your experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button className="h-20 flex-col gap-2" data-testid="button-view-menu">
                    <MessageSquare className="h-6 w-6" />
                    <span>Browse Today's Menu</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" data-testid="button-recent-reviews">
                    <Star className="h-6 w-6" />
                    <span>Read Recent Reviews</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity yet</p>
                  <p className="text-sm">Start by reviewing your favorite campus meals!</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email || 'Not provided'}</p>
                </div>
                {user?.firstName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{user.firstName} {user?.lastName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Account Status</p>
                  <p className="font-medium text-green-600">Verified</p>
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Community Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Be honest and constructive in your reviews</li>
                  <li>• Focus on food quality, taste, and value</li>
                  <li>• Respect dining staff and fellow students</li>
                  <li>• Report any issues or inaccurate information</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}