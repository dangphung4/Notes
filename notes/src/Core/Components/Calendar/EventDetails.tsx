import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { MapPinIcon, ClockIcon, UserPlusIcon } from 'lucide-react';
import type { CalendarEvent } from '../../Database/db';
import { auth } from '../../Auth/firebase';

interface EventDetailsProps {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onClose: () => void;
}

export const EventDetails = ({ event, onEdit, onDelete, onShare, onClose }: EventDetailsProps) => {
  const canEdit = event.createdBy === auth.currentUser?.email || 
    event.sharedWith?.some(share => 
      share.email === auth.currentUser?.email && 
      share.permission === 'edit'
    );

  return (
    <div className="flex flex-col">
      <div className="p-3 space-y-3">
        {/* Time and date */}
        <div className="flex items-start gap-2">
          <ClockIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="space-y-0.5">
            <div>
              {event.allDay ? 'All day' : (
                `${format(event.startDate, 'h:mm a')} - 
                 ${format(event.endDate ?? '', 'h:mm a')}`
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(event.startDate, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-2">
            <MapPinIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>{event.location}</div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="pt-2 border-t">
            <div className="font-medium mb-1 text-sm">Description</div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </div>
          </div>
        )}

        {/* Shared with */}
        {event.sharedWith && event.sharedWith.length > 0 && (
          <div className="pt-4 border-t">
            <div className="font-medium mb-2">Shared with</div>
            <div className="space-y-2">
              {event.sharedWith.map((share) => (
                <div key={share.email} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <UserPlusIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{share.email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {share.permission} • {share.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center px-2 py-0.5 rounded-full text-xs"
                style={{ 
                  backgroundColor: tag.color + '20',
                  color: tag.color 
                }}
              >
                {tag.name}
              </div>
            ))}
          </div>
        )}

        {/* Reminder */}
        <div className="pt-4 border-t">
          <div className="font-medium mb-2">Reminder</div>
          <div className="text-sm text-muted-foreground">
            {event.reminderMinutes 
              ? `${event.reminderMinutes} minutes before`
              : 'No reminder set'}
          </div>
        </div>

        {/* Created by */}
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <div>Created by {event.createdBy}</div>
          {event.lastModifiedBy && (
            <div>Last modified by {event.lastModifiedBy}</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t p-3 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {canEdit && (
          <>
            <Button variant="outline" onClick={onShare}>
              Share
            </Button>
            <Button variant="outline" onClick={onEdit}>
              Edit
            </Button>
          </>
        )}
        {event.createdBy === auth.currentUser?.email && (
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}; 