import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function NewMessagePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const createThreadMutation = useMutation({
    mutationFn: (data: { subject: string; content: string }) => 
      apiRequest("POST", "/api/threads", data),
    onSuccess: (data) => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully. We'll respond as soon as possible.",
      });
      
      // Invalidate threads list to show the new thread
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      
      // Navigate to the new thread - API returns { thread, message }
      setLocation(`/messages/${data.thread.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.error || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !content.trim()) {
      toast({
        title: "Please fill in all fields",
        description: "Both subject and message content are required",
        variant: "destructive",
      });
      return;
    }

    if (subject.length > 200) {
      toast({
        title: "Subject too long",
        description: "Subject must be 200 characters or less",
        variant: "destructive",
      });
      return;
    }

    if (content.length > 2000) {
      toast({
        title: "Message too long",
        description: "Message must be 2000 characters or less",
        variant: "destructive",
      });
      return;
    }

    createThreadMutation.mutate({
      subject: subject.trim(),
      content: content.trim(),
    });
  };

  const goBack = () => {
    setLocation("/profile");
  };

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
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-new-message-title">
              New Message
            </h1>
            <p className="text-muted-foreground text-sm">
              Contact support for help or feedback
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Send a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your message..."
                  maxLength={200}
                  disabled={createThreadMutation.isPending}
                  data-testid="input-subject"
                />
                <p className="text-xs text-muted-foreground">
                  {subject.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Please describe your question, concern, or feedback in detail..."
                  rows={8}
                  maxLength={2000}
                  disabled={createThreadMutation.isPending}
                  data-testid="textarea-content"
                />
                <p className="text-xs text-muted-foreground">
                  {content.length}/2000 characters
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={createThreadMutation.isPending}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!subject.trim() || !content.trim() || createThreadMutation.isPending}
                  className="flex-1"
                  data-testid="button-send"
                >
                  {createThreadMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2">Tips for getting help:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Be specific about any issues you're experiencing</li>
            <li>• Include relevant details like dates, times, or menu items</li>
            <li>• For technical issues, describe what you were trying to do</li>
            <li>• We typically respond within 24 hours</li>
          </ul>
        </div>
      </div>
    </div>
  );
}