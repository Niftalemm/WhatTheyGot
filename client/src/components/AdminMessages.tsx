import { useQuery } from "@tanstack/react-query";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, AlertCircle, Megaphone } from "lucide-react";
import type { AdminMessage } from "@shared/schema";

interface AdminMessagesProps {
  page?: string;
  className?: string;
}

const messageTypeIcons = {
  announcement: Megaphone,
  alert: AlertTriangle,
  info: Info,
  warning: AlertCircle,
};

const messageTypeColors = {
  announcement: "default",
  alert: "destructive",
  info: "secondary", 
  warning: "destructive",
} as const;

export default function AdminMessages({ page, className }: AdminMessagesProps) {
  const { data: messages = [], isLoading } = useQuery<AdminMessage[]>({
    queryKey: ['/api/messages', page],
    queryFn: () => fetch(`/api/messages${page ? `?page=${page}` : ''}`).then(res => res.json()),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  if (isLoading || messages.length === 0) {
    return null;
  }

  // Filter messages based on page if specified
  const filteredMessages = page 
    ? messages.filter(msg => 
        msg.showOn.includes(page) || 
        msg.showOn.includes('all') || 
        msg.showOn.length === 0
      )
    : messages;

  if (filteredMessages.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {filteredMessages.map((message) => {
        const IconComponent = messageTypeIcons[message.type as keyof typeof messageTypeIcons] || Info;
        const variant = message.type === 'alert' || message.type === 'warning' ? 'destructive' : 'default';
        
        return (
          <Alert 
            key={message.id} 
            variant={variant}
            className="border-l-4 border-l-primary"
            data-testid={`alert-admin-message-${message.id}`}
          >
            <IconComponent className="h-4 w-4" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <AlertTitle className="flex items-center gap-2">
                  {message.title}
                  <Badge 
                    variant={messageTypeColors[message.type as keyof typeof messageTypeColors]}
                    className="text-xs"
                  >
                    {message.type}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="mt-2">
                  {message.content}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        );
      })}
    </div>
  );
}