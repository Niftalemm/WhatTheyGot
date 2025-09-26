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
import { ArrowLeft, Plus, MessageSquare, Send, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface AdminMessage {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'alert' | 'info' | 'warning';
  isActive: boolean;
  showOn: string[];
  createdAt: string;
  updatedAt: string;
}

const MESSAGE_TYPES = [
  { value: 'announcement', label: 'Announcement', color: 'bg-blue-500' },
  { value: 'alert', label: 'Alert', color: 'bg-red-500' },
  { value: 'info', label: 'Information', color: 'bg-gray-500' },
  { value: 'warning', label: 'Warning', color: 'bg-yellow-500' },
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/admin/dashboard')}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Message Management</h1>
                <p className="text-muted-foreground">Create announcements and alerts for students</p>
              </div>
            </div>
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
                });
              }}
              data-testid="button-new-message"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
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