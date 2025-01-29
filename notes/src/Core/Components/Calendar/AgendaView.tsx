import { format } from 'date-fns';
import { MapPinIcon, Share2Icon } from 'lucide-react';
import type { CalendarEvent } from '../../Database/db';

interface AgendaViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export const AgendaView = ({ events, onEventClick }: AgendaViewProps) => {
  const groupEventsByDate = (events: CalendarEvent[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureEvents = events.filter(event => {
      const eventDate = new Date(event.startDate);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });

    const grouped = futureEvents.reduce((acc, event) => {
      const dateKey = format(new Date(event.startDate), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);

    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
    });

    return Object.fromEntries(
      Object.entries(grouped).sort(([dateA], [dateB]) => 
        new Date(dateA).getTime() - new Date(dateB).getTime()
      )
    );
  };

  const groupedEvents = groupEventsByDate(events);

  return (
    <div className="space-y-4 p-4">
      {Object.entries(groupedEvents).length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p>No events scheduled</p>
        </div>
      ) : (
        Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-2">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </h3>
            <div className="space-y-2">
              {dateEvents.map(event => (
                <div
                  key={event.id}
                  className="rounded-lg border bg-card p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-24 flex-shrink-0">
                      {event.allDay ? (
                        <span className="text-sm font-medium text-muted-foreground">All day</span>
                      ) : (
                        <div className="text-sm">
                          <div className="font-medium">
                            {format(new Date(event.startDate), 'h:mm a')}
                          </div>
                          <div className="text-muted-foreground">
                            {format(new Date(event.endDate), 'h:mm a')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: event.color || '#3b82f6' }}
                          />
                          <h4 className="font-medium truncate">{event.title}</h4>
                        </div>
                        {event.sharedWith && event.sharedWith.length > 0 && (
                          <div className="flex-shrink-0">
                            <Share2Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPinIcon className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {event.tags.map(tag => (
                            <div
                              key={tag.id}
                              className="px-2 py-0.5 rounded-full text-xs"
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}; 