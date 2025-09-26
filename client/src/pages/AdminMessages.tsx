import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, MessageSquare, Send, Edit, Trash2, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface AdminMessage {
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

const MESSAGE_TYPES = [
  { value: 'announcement', label: 'Announcement', color: 'bg-blue-500' },
  { value: 'alert', label: 'Alert', color: 'bg-red-500' },
  { value: 'info', label: 'Information', color: 'bg-gray-500' },
  { value: 'warning', label: 'Warning', color: 'bg-yellow-500' },
  { value: 'poll', label: 'Poll', color: 'bg-green-500' },
];

const SHOW_ON_OPTIONS = [
  { value: 'all', label: 'All Pages' },
  { value: 'menu', label: 'Menu Page' },
  { value: 'reviews', label: 'Reviews Page' },
];

export default function AdminMessages() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState<AdminMessage | null>(null);
  
  const [messageForm, setMessageForm] = useState({
    title: '',
    content: '',
    type: 'announcement' as const,
    isActive: true,
    showOn: ['all'] as string[],
    pollQuestion: '',
    pollOptions: ['', ''] as string[],
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setLocation('/admin/login');
      return;
    }
    
    fetchMessages();
  }, [setLocation]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/messages', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load messages.',
        variant: 'destructive',
      });
    }
  };

  const handleShowOnToggle = (option: string) => {
    setMessageForm(prev => ({
      ...prev,
      showOn: prev.showOn.includes(option)
        ? prev.showOn.filter(o => o !== option)
        : [...prev.showOn, option]
    }));
  };

  const addPollOption = () => {
    if (messageForm.pollOptions.length < 5) {
      setMessageForm(prev => ({
        ...prev,
        pollOptions: [...prev.pollOptions, '']
      }));
    }
  };

  const removePollOption = (index: number) => {
    if (messageForm.pollOptions.length > 2) {
      setMessageForm(prev => ({
        ...prev,
        pollOptions: prev.pollOptions.filter((_, i) => i !== index)
      }));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    setMessageForm(prev => ({
      ...prev,
      pollOptions: prev.pollOptions.map((option, i) => i === index ? value : option)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const method = editingMessage ? 'PUT' : 'POST';
      const url = editingMessage 
        ? `/api/admin/messages/${editingMessage.id}`
        : '/api/admin/messages';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(messageForm),
      });

      if (response.ok) {
        toast({
          title: editingMessage ? 'Message Updated!' : 'Message Created!',
          description: `Your ${messageForm.type} has been ${editingMessage ? 'updated' : 'published'}.`,
        });
        
        // Reset form and refresh
        setMessageForm({
          title: '',
          content: '',
          type: 'announcement',
          isActive: true,
          showOn: ['all'],
          pollQuestion: '',
          pollOptions: ['', ''],
        });
        setShowForm(false);
        setEditingMessage(null);
        fetchMessages();
      } else {
        throw new Error('Failed to save message');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (message: AdminMessage) => {
    setEditingMessage(message);
    setMessageForm({
      title: message.title,
      content: message.content,
      type: message.type as any,
      isActive: message.isActive,
      showOn: message.showOn || ['all'],
      pollQuestion: message.pollQuestion || '',
      pollOptions: message.pollOptions && message.pollOptions.length > 0 ? message.pollOptions : ['', ''],
    });
    setShowForm(true);
  };

  const handleToggleActive = async (message: AdminMessage) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/messages/${message.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...message, isActive: !message.isActive }),
      });

      if (response.ok) {
        toast({
          title: 'Message Updated',
          description: `Message is now ${!message.isActive ? 'active' : 'hidden'}.`,
        });
        fetchMessages();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update message status.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast({
          title: 'Message Deleted',
          description: 'The message has been permanently removed.',
        });
        fetchMessages();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message.',
        variant: 'destructive',
      });
    }
  };

  // Poll voting component
  const PollDisplay = ({ message }: { message: AdminMessage }) => {
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string>('');

    // Query to get poll results
    const { data: pollResults, refetch: refetchResults } = useQuery({
      queryKey: ['poll-results', message.id],
      queryFn: () => fetch(`/api/polls/${message.id}/results`).then(res => res.json()),
      enabled: message.type === 'poll',
      refetchInterval: 2000, // Real-time updates every 2 seconds
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
          description: 'Your vote has been counted.',
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

    // Reveal results mutation
    const revealMutation = useMutation({
      mutationFn: async () => {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/polls/${message.id}/reveal`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to reveal results');
        return response.json();
      },
      onSuccess: () => {
        refetchResults();
        queryClient.invalidateQueries({ queryKey: ['poll-results', message.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
        queryClient.invalidateQueries({ queryKey: ['home-messages'] });
        toast({
          title: 'Results Revealed!',
          description: 'Poll results are now visible to all users.',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to reveal poll results. Please try again.',
          variant: 'destructive',
        });
      }
    });

    const handleVote = () => {
      if (selectedOption && !hasVoted) {
        voteMutation.mutate(selectedOption);
      }
    };

    const handleReveal = () => {
      if (confirm('Are you sure you want to reveal the poll results to all users? This action cannot be undone.')) {
        revealMutation.mutate();
      }
    };

    const totalVotes = pollResults?.results?.reduce((sum: number, result: any) => sum + result.voteCount, 0) || 0;

    return (
      <div className="space-y-4">
        <div className="bg-muted/20 p-4 rounded-lg">
          <h4 className="font-medium text-green-600 dark:text-green-400 mb-3">
            <BarChart3 className="w-4 h-4 inline mr-2" />
            {message.pollQuestion}
          </h4>
          
          {!hasVoted ? (
            <div className="space-y-2">
              {pollResults?.options?.map((option: any) => (
                <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`poll-${message.id}`}
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="text-green-600"
                    data-testid={`radio-poll-option-${option.id}`}
                  />
                  <span>{option.optionText}</span>
                </label>
              ))}
              <Button 
                onClick={handleVote}
                disabled={!selectedOption || voteMutation.isPending}
                size="sm"
                className="mt-2"
                data-testid="button-vote"
              >
                {voteMutation.isPending ? 'Voting...' : 'Vote'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Poll Results ({totalVotes} votes)
              </p>
              {pollResults?.results?.map((result: any) => {
                const percentage = totalVotes > 0 ? Math.round((result.voteCount / totalVotes) * 100) : 0;
                return (
                  <div key={result.optionId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{result.optionText}</span>
                      <span className="text-muted-foreground">{percentage}% ({result.voteCount})</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              
              {/* Admin reveal button */}
              <div className="mt-4 pt-3 border-t border-muted">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Admin Controls
                  </p>
                  {!message.resultsRevealed ? (
                    <Button 
                      onClick={handleReveal}
                      disabled={revealMutation.isPending}
                      size="sm"
                      variant="outline"
                      data-testid="button-reveal-results"
                    >
                      {revealMutation.isPending ? 'Revealing...' : 'Reveal Results'}
                    </Button>
                  ) : (
                    <Badge variant="secondary">Results Revealed</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getTypeColor = (type: string) => {
    return MESSAGE_TYPES.find(t => t.value === type)?.color || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          {/* Mobile-friendly header layout */}
          <div className="space-y-4">
            {/* Top row: Back button and title */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-4 mb-2">
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
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Message Management</h1>
                  <p className="text-sm text-muted-foreground">Create announcements, alerts, and polls for students</p>
                </div>
              </div>
            </div>
            
            {/* Bottom row: Action button */}
            <div className="flex justify-center sm:justify-end">
              <Button 
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingMessage(null);
                  setMessageForm({
                    title: '',
                    content: '',
                    type: 'announcement',
                    isActive: true,
                    showOn: ['all'],
                    pollQuestion: '',
                    pollOptions: ['', ''],
                  });
                }}
                className="w-full sm:w-auto"
                data-testid="button-new-message"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          
          {/* Message Form */}
          {showForm && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    {editingMessage ? 'Edit Message' : 'Create Message'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Message title"
                        value={messageForm.title}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                        data-testid="input-message-title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Message content..."
                        rows={4}
                        value={messageForm.content}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                        required
                        data-testid="textarea-message-content"
                      />
                    </div>

                    {/* Poll-specific fields */}
                    {messageForm.type === 'poll' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="pollQuestion">Poll Question</Label>
                          <Input
                            id="pollQuestion"
                            placeholder="What question would you like to ask?"
                            value={messageForm.pollQuestion}
                            onChange={(e) => setMessageForm(prev => ({ ...prev, pollQuestion: e.target.value }))}
                            required
                            data-testid="input-poll-question"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Poll Options</Label>
                          {messageForm.pollOptions.map((option, index) => (
                            <div key={index} className="flex space-x-2">
                              <Input
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => updatePollOption(index, e.target.value)}
                                required
                                data-testid={`input-poll-option-${index}`}
                              />
                              {messageForm.pollOptions.length > 2 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removePollOption(index)}
                                  data-testid={`button-remove-option-${index}`}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          ))}
                          {messageForm.pollOptions.length < 5 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addPollOption}
                              data-testid="button-add-option"
                            >
                              Add Option
                            </Button>
                          )}
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>Message Type</Label>
                      <Select 
                        value={messageForm.type} 
                        onValueChange={(value: any) => setMessageForm(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger data-testid="select-message-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MESSAGE_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${type.color} mr-2`}></div>
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Show On Pages</Label>
                      <div className="space-y-2">
                        {SHOW_ON_OPTIONS.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={option.value}
                              checked={messageForm.showOn.includes(option.value)}
                              onChange={() => handleShowOnToggle(option.value)}
                              className="rounded"
                              data-testid={`checkbox-show-on-${option.value}`}
                            />
                            <Label htmlFor={option.value} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={messageForm.isActive}
                        onCheckedChange={(checked) => setMessageForm(prev => ({ ...prev, isActive: checked }))}
                        data-testid="switch-message-active"
                      />
                      <Label htmlFor="isActive" className="text-sm">
                        Publish immediately
                      </Label>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading}
                      data-testid="button-save-message"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isLoading ? 'Saving...' : (editingMessage ? 'Update Message' : 'Publish Message')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Messages List */}
          <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
            <Card>
              <CardHeader>
                <CardTitle>Published Messages</CardTitle>
                <CardDescription>
                  Manage announcements and alerts displayed to students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div 
                        key={message.id} 
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`message-${message.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`w-3 h-3 rounded-full ${getTypeColor(message.type)}`}></div>
                              <h3 className="font-medium">{message.title}</h3>
                              <Badge 
                                variant={message.isActive ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {message.isActive ? 'Active' : 'Hidden'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {message.content}
                            </p>
                            
                            {/* Display poll voting interface for poll messages */}
                            {message.type === 'poll' && (
                              <div className="mt-4">
                                <PollDisplay message={message} />
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Type: {message.type}</span>
                              <span>Shows on: {message.showOn?.join(', ') || 'All pages'}</span>
                              <span>Created: {formatDate(message.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(message)}
                              data-testid={`button-toggle-${message.id}`}
                            >
                              {message.isActive ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(message)}
                              data-testid={`button-edit-${message.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(message.id)}
                              data-testid={`button-delete-${message.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                      <p className="text-muted-foreground">
                        Create your first message to communicate with students using the "New Message" button above
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}