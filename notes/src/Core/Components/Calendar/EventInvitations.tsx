import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { db, CalendarEvent } from '../../Database/db';
import { auth } from '../../Auth/firebase';
import { useToast } from '@/hooks/use-toast';
import { ClockIcon, MapPinIcon } from 'lucide-react';

interface EventInvitationsProps {
  initialPendingEvents: CalendarEvent[];
  onEventsUpdate: () => void;
}

export function EventInvitations({ initialPendingEvents, onEventsUpdate }: EventInvitationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<CalendarEvent[]>(initialPendingEvents);
  const { toast } = useToast();

  useEffect(() => {
    setPendingEvents(initialPendingEvents);
  }, [initialPendingEvents]);

  const loadPendingEvents = async () => {
    try {
      const events = await db.getSharedEvents();
      const userEmail = auth.currentUser?.email;

      const pending = events.filter(event => {
        const userShare = event.sharedWith?.find(share => share.email === userEmail);
        return userShare?.status === 'pending';
      });

      setPendingEvents(pending);
    } catch (error) {
      console.error('Error loading shared events:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPendingEvents();
    }
  }, [isOpen]);

  const handleResponse = async (event: CalendarEvent, status: 'accepted' | 'declined') => {
    try {
      if (!event.firebaseId) {
        throw new Error('Event Firebase ID is missing');
      }
      
      await db.updateEventShare(event.firebaseId, auth.currentUser?.email || '', status);
      await loadPendingEvents();
      onEventsUpdate();
      
      toast({
        title: status === 'accepted' ? 'Event Accepted' : 'Event Declined',
        description: `You have ${status} the event "${event.title}"`,
      });

      // If there are no more pending events, close the dialog
      if (pendingEvents.length <= 1) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event status',
        variant: 'destructive',
      });
    }
  };

  const EventCard = ({ event }: { event: CalendarEvent }) => (
    <div className="border rounded-lg p-4 space-y-2 mb-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{event.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <ClockIcon className="h-4 w-4" />
            <span>
              {event.allDay ? (
                format(new Date(event.startDate), 'MMM d, yyyy')
              ) : (
                `${format(new Date(event.startDate ?? ''), 'MMM d, yyyy h:mm a')} - 
                 ${format(new Date(event.endDate ?? ''), 'h:mm a')}`
              )}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPinIcon className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => handleResponse(event, 'accepted')}
          >
            Accept
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => handleResponse(event, 'declined')}
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        Invitations
        {pendingEvents.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {pendingEvents.length}
          </span>
        )}
      </Button>

      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Calendar Invitations</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {pendingEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pending invitations
            </p>
          ) : (
            pendingEvents.map(event => (
              <EventCard 
                key={event.firebaseId || event.id}
                event={event} 
              />
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 