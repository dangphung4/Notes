import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { db } from '../Database/db';
import type { CalendarEvent } from '../Database/db';
import { PlusIcon, MapPinIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, Share2Icon, UserPlusIcon, X, Check, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, setYear } from "date-fns";
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auth } from '../Auth/firebase';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { TagSelector } from '@/components/TagSelector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EventInvitations } from '../Components/Calendar/EventInvitations';
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

const scrollToCurrentTime = (containerRef: React.RefObject<HTMLDivElement>, dayElement?: HTMLElement | null) => {
  if (!containerRef.current) return;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Vertical scroll to current time
  const scrollPosition = (currentHour + currentMinute / 60) * 80 - (containerRef.current.clientHeight / 2);
  
  // Handle horizontal scroll for week view first
  if (dayElement) {
    const horizontalScroll = dayElement.offsetLeft - (containerRef.current.clientWidth / 2) + (dayElement.offsetWidth / 2);
    containerRef.current.scrollLeft = horizontalScroll;
  }
  
  // Then handle vertical scroll with a small delay
  setTimeout(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, 100);
};

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = new Date();
      time.setHours(hour, minute, 0, 0);
      options.push({
        value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        label: format(time, 'h:mm a')
      });
    }
  }
  return options;
};

// New compact time picker component
const TimePicker = ({ value, onChange }: { value: Date, onChange: (date: Date) => void }) => {
  return (
    <Select
      value={format(value, 'HH:mm')}
      onValueChange={(time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(value);
        newDate.setHours(hours, minutes);
        onChange(newDate);
      }}
    >
      <SelectTrigger className="w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {generateTimeOptions().map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Add the same preset colors at the top
const presetColors = [
  // Blues
  '#3b82f6', '#60a5fa', '#2563eb',
  // Reds
  '#ef4444', '#f87171', '#dc2626',
  // Greens
  '#22c55e', '#4ade80', '#16a34a',
  // Yellows/Oranges
  '#f59e0b', '#fbbf24', '#d97706',
  // Purples
  '#6366f1', '#a855f7', '#7c3aed',
  // Pinks
  '#ec4899', '#f472b6', '#db2777',
  // Grays
  '#6b7280', '#4b5563', '#374151',
  // Teals
  '#14b8a6', '#2dd4bf', '#0d9488',
];

// Redesigned event form
const EventForm = ({ isCreate, initialEvent, onSubmit, onCancel }) => {
  const [event, setEvent] = useState(initialEvent);
  const [showMore, setShowMore] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [shareEmails, setShareEmails] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');

  const handleCreateTag = async (tag: Partial<Tags>) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const newTag: Partial<Tags> = {
      ...tag,
      createdBy: user.email || '',
      createdAt: new Date()
    };

    // Add to database
    return await db.createTag(newTag);
  };

  return (
    <div className="flex flex-col">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Pencil2Icon className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Add title"
            value={event.title || ''}
            onChange={e => setEvent({ ...event, title: e.target.value })}
            className="text-lg font-medium border-none p-0 focus-visible:ring-0"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-16 text-muted-foreground">Starts</div>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="date"
                value={format(event.startDate || new Date(), 'yyyy-MM-dd')}
                onChange={e => {
                  const date = new Date(e.target.value);
                  const current = new Date(event.startDate || new Date());
                  date.setHours(current.getHours(), current.getMinutes());
                  setEvent({ ...event, startDate: date });
                }}
                className="w-36"
              />
              {!event.allDay && <TimePicker value={event.startDate || new Date()} onChange={date => setEvent({ ...event, startDate: date })} />}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="w-16 text-muted-foreground">Ends</div>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="date"
                value={format(event.endDate || new Date(), 'yyyy-MM-dd')}
                onChange={e => {
                  const date = new Date(e.target.value);
                  const current = new Date(event.endDate || new Date());
                  date.setHours(current.getHours(), current.getMinutes());
                  setEvent({ ...event, endDate: date });
                }}
                className="w-36"
              />
              {!event.allDay && <TimePicker value={event.endDate || new Date()} onChange={date => setEvent({ ...event, endDate: date })} />}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm pl-16">
            <Switch
              checked={event.allDay}
              onCheckedChange={checked => setEvent({ ...event, allDay: checked })}
            />
            <Label className="text-muted-foreground">All day</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: event.color || '#3b82f6' }}
                  />
                  {event.color || '#3b82f6'}
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full transition-all relative",
                        event.color === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setEvent(prev => ({ ...prev, color }));
                        setIsColorPickerOpen(false);
                      }}
                    >
                      {event.color === color && (
                        <Check className="h-4 w-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </button>
                  ))}
                </div>
                <Input
                  type="color"
                  value={event.color || '#3b82f6'}
                  onChange={e => setEvent(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-8"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start h-8 px-0 text-muted-foreground"
          onClick={() => setShowMore(!showMore)}
        >
          <ChevronRightIcon className={cn(
            "h-4 w-4 mr-2 transition-transform",
            showMore && "rotate-90"
          )} />
          {showMore ? "Hide details" : "Add details"}
        </Button>

        {showMore && (
          <div className="space-y-3 animate-in slide-in-from-left">
            <div className="flex items-center gap-2 text-sm group">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Add location"
                value={event.location || ''}
                onChange={e => setEvent({ ...event, location: e.target.value })}
                className="flex-1 border-none px-0 focus-visible:ring-0"
              />
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Add description"
                value={event.description || ''}
                onChange={e => setEvent({ ...event, description: e.target.value })}
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <Select
                value={event.reminderMinutes?.toString()}
                onValueChange={(value) => setEvent({ ...event, reminderMinutes: parseInt(value) })}
              >
                <SelectTrigger className="border-none px-0">
                  <SelectValue placeholder="Add reminder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">At time of event</SelectItem>
                  <SelectItem value="1">1 minute before</SelectItem>
                  <SelectItem value="3">3 minutes before</SelectItem>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Add tag selector */}
            <div className="space-y-1">
              <Label className="text-sm">Tags</Label>
              <TagSelector
                selectedTags={event.tags || []}
                onTagsChange={tags => setEvent({ ...event, tags })}
                onCreateTag={handleCreateTag}
              />
            </div>

            {/* Add sharing section */}
            <div className="space-y-2">
              <Label className="text-sm">Share with others</Label>
              <Textarea
                placeholder="Enter email addresses (one per line)"
                value={shareEmails}
                onChange={(e) => setShareEmails(e.target.value)}
                className="min-h-[80px] text-sm"
              />
              <Select
                value={sharePermission}
                onValueChange={(value) => setSharePermission(value as 'view' | 'edit')}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Can view</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                </SelectContent>
              </Select>
              {event.sharedWith && event.sharedWith.length > 0 && (
                <div className="mt-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Currently shared with:</Label>
                  {event.sharedWith.map((share) => (
                    <div key={share.email} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <UserPlusIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{share.email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setEvent({
                            ...event,
                            sharedWith: event.sharedWith?.filter(s => s.email !== share.email)
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          size="sm" 
          onClick={() => {
            // Process sharing emails
            const newShares = shareEmails
              .split('\n')
              .map(email => email.trim())
              .filter(Boolean)
              .map(email => ({
                email,
                permission: sharePermission,
                status: 'pending'
              }));

            // Combine with existing shares, removing duplicates
            const existingEmails = new Set(event.sharedWith?.map(s => s.email) || []);
            const uniqueNewShares = newShares.filter(share => !existingEmails.has(share.email));

            onSubmit({
              ...event,
              sharedWith: [...(event.sharedWith || []), ...uniqueNewShares]
            });
          }}
        >
          {isCreate ? 'Save' : 'Update'}
        </Button>
      </div>
    </div>
  );
};

// Add this helper function near the top with other utility functions
const groupEventsByDate = (events: CalendarEvent[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter out past events
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

  // Sort events within each day by start time
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  });

  // Sort dates
  return Object.fromEntries(
    Object.entries(grouped).sort(([dateA], [dateB]) => 
      new Date(dateA).getTime() - new Date(dateB).getTime()
    )
  );
};

// Update the AgendaView component
const AgendaView = ({ 
  events, 
  onEventClick 
}: { 
  events: CalendarEvent[], 
  onEventClick: (event: CalendarEvent) => void 
}) => {
  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="space-y-4 p-4">
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No events scheduled</p>
          </div>
        ) : (
          Object.entries(groupEventsByDate(events)).map(([date, dateEvents]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-2">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="space-y-1">
                {dateEvents.map(event => (
                  <AgendaEventBlock 
                    key={event.firebaseId || event.id}
                    event={event} 
                    onEventClick={onEventClick}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

// Week view event block - simplified
const WeekEventBlock = ({ event, onEventClick }: { event: CalendarEvent; onEventClick: (event: CalendarEvent) => void }) => {
  return (
    <div
      className="absolute inset-x-1 rounded-sm p-1 text-xs hover:ring-2 hover:ring-primary cursor-pointer"
      style={{
        backgroundColor: event.color + '33',
        borderLeft: `3px solid ${event.color}`,
        top: '2px',
        minHeight: '18px'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
    >
        <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-muted flex-shrink-0 overflow-hidden"
            title={`Created by ${event.createdBy}`}
            >
                {event.createdByPhotoURL ? (
                    <img src={event.createdByPhotoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">{event.createdBy.charAt(0).toUpperCase()}</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium truncate flex items-center gap-1">
                    {event.title}
                    {event.sharedWith && event.sharedWith.length > 0 && (
                        <Share2Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
            <div className="flex items-center gap-1 text-xs">
                <ClockIcon className="w-2 h-2" />
                {event.startDate && format(new Date(event.startDate), 'h:mm')} - {event.endDate && format(new Date(event.endDate), 'h:mm')}
            </div>
        </div>
  
    </div>
  );
};

// Enhanced Agenda view event block with mobile responsiveness
const AgendaEventBlock = ({ event, onEventClick }: { event: CalendarEvent; onEventClick: (event: CalendarEvent) => void }) => {
  return (
    <div
      className="rounded-lg border bg-card p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer mb-3 group"
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Time & Status Column */}
        <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 sm:w-32 flex-shrink-0 border-b sm:border-b-0 pb-3 sm:pb-0">
          {event.allDay ? (
            <span className="text-sm font-medium text-muted-foreground">All day</span>
          ) : (
            <div className="text-sm flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1">
              <div className="font-medium whitespace-nowrap">
                {format(new Date(event.startDate), 'h:mm a')}
              </div>
              <div className="text-muted-foreground whitespace-nowrap">
                {format(new Date(event.endDate || event.startDate), 'h:mm a')}
              </div>
            </div>
          )}
          {event.reminderMinutes && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap ml-auto sm:ml-0">
              <ClockIcon className="h-3 w-3" />
              <span>{event.reminderMinutes}m reminder</span>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div 
                className="w-8 h-8 rounded-full bg-muted flex-shrink-0 overflow-hidden"
                title={`Created by ${event.createdBy}`}
              >
                {event.createdByPhotoURL ? (
                  <img 
                    src={event.createdByPhotoURL} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                    {event.createdBy.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color || '#3b82f6' }}
                  />
                  <h4 className="font-medium text-base truncate">{event.title}</h4>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm text-muted-foreground">
                  <span className="truncate max-w-[200px]">{event.createdBy}</span>
                  {event.lastModifiedBy && event.lastModifiedBy !== event.createdBy && (
                    <span className="truncate max-w-[200px]">• edited by {event.lastModifiedBy}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sharing Status */}
            {event.sharedWith && event.sharedWith.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground self-start">
                <Share2Icon className="h-4 w-4" />
                <span className="text-xs">{event.sharedWith.length}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Footer Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:justify-between pt-1">
            {/* Tags */}
            <div className="flex flex-wrap gap-1 w-full sm:w-auto">
              {event.tags && event.tags.map(tag => (
                <div
                  key={tag.id}
                  className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color
                  }}
                >
                  {tag.name}
                </div>
              ))}
            </div>

            {/* Shared Users Preview */}
            {event.sharedWith && event.sharedWith.length > 0 && (
              <div className="flex -space-x-2 ml-0 sm:ml-2">
                {event.sharedWith.slice(0, 3).map((share) => (
                  <div
                    key={share.email}
                    className="w-6 h-6 rounded-full bg-muted ring-2 ring-background overflow-hidden"
                    title={`${share.email} (${share.permission})`}
                  >
                    <span className="w-full h-full flex items-center justify-center text-xs">
                      {share.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
                {event.sharedWith.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-xs">
                    +{event.sharedWith.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Day view event block
const DayEventBlock = ({ event, onEventClick }: { event: CalendarEvent; onEventClick: (event: CalendarEvent) => void }) => {
  return (
    <div
      className="absolute inset-x-1 rounded-sm p-1.5 text-xs group hover:ring-2 hover:ring-primary cursor-pointer"
      style={{
        backgroundColor: event.color + '33',
        borderLeft: `3px solid ${event.color}`,
        top: '2px',
        minHeight: '18px'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
    >
      <div className="flex items-center gap-1">
        <div 
          className="w-4 h-4 rounded-full bg-muted flex-shrink-0 overflow-hidden"
          title={`Created by ${event.createdBy}`}
        >
          {event.createdByPhotoURL ? (
            <img 
              src={event.createdByPhotoURL} 
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
              {event.createdBy.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate flex items-center gap-1">
            {event.title}
            {event.sharedWith && event.sharedWith.length > 0 && (
              <Share2Icon className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          {event.location && (
            <div className="truncate text-muted-foreground">
              {event.location}
            </div>
          )}


          {event.startDate && event.endDate && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
            </p>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.tags.map(tag => (
                <div key={tag.id} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                  {tag.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareEmails, setShareEmails] = useState<string>('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');
  const [pendingInvitations, setPendingInvitations] = useState<CalendarEvent[]>([]);

  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    allDay: false,
    reminderMinutes: 30,
    location: '',
    color: '#3b82f6',
    sharedWith: []
  });

  const [newParticipant, setNewParticipant] = useState('');

  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(startOfWeek(currentWeek), i)
  );

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDateAndTime = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return isSameDay(eventDate, date) && eventDate.getHours() === hour;
    });
  };

  const loadPendingInvitations = async () => {
    try {
      const events = await db.getSharedEvents();
      const userEmail = auth.currentUser?.email;

      const pending = events.filter(event => {
        const userShare = event.sharedWith?.find(share => share.email === userEmail);
        return userShare?.status === 'pending';
      });

      setPendingInvitations(pending);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  useEffect(() => {
    loadEvents();
    loadPendingInvitations();
  }, []);

  async function loadEvents() {
    try {
      // Get local events
      const localEvents = await db.calendarEvents.toArray();
      
      // Get shared events that have been accepted
      const sharedEvents = await db.getSharedEvents();
      const acceptedSharedEvents = sharedEvents.filter(event => {
        const userEmail = auth.currentUser?.email;
        const userShare = event.sharedWith?.find(share => share.email === userEmail);
        return userShare?.status === 'accepted';
      });
      
      // Create a Map to ensure unique events by firebaseId
      const eventMap = new Map();
      
      // Prefer local events
      localEvents.forEach(event => {
        eventMap.set(event.firebaseId, event);
      });
      
      // Add shared events only if they don't exist locally
      acceptedSharedEvents.forEach(event => {
        if (!eventMap.has(event.firebaseId)) {
          eventMap.set(event.firebaseId, event);
        }
      });
      
      // Convert Map back to array
      setEvents(Array.from(eventMap.values()));
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar events",
        variant: "destructive"
      });
    }
  }

  const handleCreateEvent = async (event: Partial<CalendarEvent>) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const eventToCreate = {
        ...event,
        createdBy: user.email || '',
        createdByPhotoURL: user.photoURL || '',
        lastModifiedBy: user.email || '',
        lastModifiedByPhotoURL: user.photoURL || '',
        lastModifiedByDisplayName: user.displayName || '',
        lastModifiedAt: new Date()
      } as CalendarEvent;

      await db.createCalendarEvent(eventToCreate);
      
      setIsCreateEventOpen(false);
      setNewEvent({
        title: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(),
        allDay: false,
        reminderMinutes: 30,
        location: '',
        color: '#3b82f6',
        sharedWith: []
      });
      
      await loadEvents();
      
      toast({
        title: "Event Created",
        description: "Your calendar event has been scheduled"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
    }
  };

  // Function to handle time slot clicks
  const handleTimeSlotClick = (date: Date, hour: number) => {
    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);
    
    setNewEvent({
      ...newEvent,
      startDate: newDate,
      endDate: new Date(newDate.getTime() + 60 * 60 * 1000) // 1 hour later
    });
    setIsCreateEventOpen(true);
  };

  // Function to handle event clicks
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const [view, setView] = useState<'week' | 'day' | 'agenda'>('week');
  
  const renderAgendaView = () => (
    <AgendaView 
      events={events} 
      onEventClick={(event) => {
        setSelectedEvent(event);
        setIsEventDetailsOpen(true);
      }} 
    />
  );

  const weekViewRef = useRef<HTMLDivElement>(null);
  const dayViewRef = useRef<HTMLDivElement>(null);
  
  // Add ref for current day element
  const currentDayRef = useRef<HTMLDivElement>(null);

  // Update useEffect to handle tab changes and initial load
  useEffect(() => {
    const handleScroll = () => {
      // Add a small delay to ensure the view is ready
      setTimeout(() => {
        if (view === 'week') {
          scrollToCurrentTime(weekViewRef, currentDayRef.current);
        } else if (view === 'day') {
          scrollToCurrentTime(dayViewRef);
        }
      }, 100);
    };

    handleScroll(); // Initial scroll when view changes

    // Also scroll when tab becomes visible
    document.addEventListener('visibilitychange', handleScroll);
    return () => document.removeEventListener('visibilitychange', handleScroll);
  }, [view]);

  // Add a separate effect for handling tab selection
  useEffect(() => {
    const tabsElement = document.querySelector('[role="tablist"]');
    if (tabsElement) {
      const observer = new MutationObserver(() => {
        if (view === 'week') {
          scrollToCurrentTime(weekViewRef, currentDayRef.current);
        } else if (view === 'day') {
          scrollToCurrentTime(dayViewRef);
        }
      });

      observer.observe(tabsElement, { attributes: true, subtree: true });
      return () => observer.disconnect();
    }
  }, [view]);

  const renderTimeIndicator = () => {
    const now = new Date();
    const top = (now.getHours() + now.getMinutes() / 60) * 80;
    
    return (
      <div 
        className="absolute left-0 right-0 z-20 pointer-events-none"
        style={{ top: `${top}px` }}
      >
        <div className="relative">
          <div className="absolute -left-2 w-4 h-4 rounded-full bg-red-500 -mt-2" />
          <div className="border-t border-red-500" />
        </div>
      </div>
    );
  };

  const renderDayView = () => (
    <div 
      className="h-full overflow-auto" 
      ref={dayViewRef}
    >
      <div className="min-w-[300px] relative">
        <div className="sticky top-0 bg-background z-10 p-4 border-b">
          <h2 className="text-lg font-semibold">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h2>
        </div>
        
        {renderTimeIndicator()}

        <div>
          {timeSlots.map(hour => (
            <div key={hour} className="flex">
              <div className="sticky left-0 w-16 pr-2 text-sm text-muted-foreground" style={{ paddingTop: '2px' }}>
                {format(new Date().setHours(hour, 0), 'ha')}
              </div>
              <div 
                className="flex-1 h-20 border-b relative cursor-pointer hover:bg-muted/50"
                onClick={() => handleTimeSlotClick(selectedDate, hour)}
              >
                <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-muted-foreground/20" />
                {getEventsForDateAndTime(selectedDate, hour).map(event => (
                  <DayEventBlock 
                    key={event.firebaseId || event.id}
                    event={event} 
                    onEventClick={(event) => {
                      setSelectedEvent(event);
                      setIsEventDetailsOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const timeOptions = generateTimeOptions();

  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<CalendarEvent> | null>(null);

  // Add isCreate state
  const [isCreate, setIsCreate] = useState(true);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <Tabs 
        defaultValue="week" 
        value={view} 
        onValueChange={(v) => setView(v as typeof view)} 
        className="flex flex-col h-full"
      >
        <div className="shrink-0 border-b bg-background">
          {/* Header Section */}
          <div className="flex flex-col gap-3 p-4">
            {/* Top Row - Title and Primary Actions */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">Calendar</h1>
              <div className="flex items-center gap-2">
                <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => {
                        setIsCreate(true);
                        setNewEvent({
                          title: '',
                          description: '',
                          startDate: new Date(),
                          endDate: new Date(),
                          allDay: false,
                          reminderMinutes: 30,
                          location: '',
                          color: '#3b82f6',
                          sharedWith: []
                        });
                      }}
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">New Event</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-[425px] p-0">
                    <DialogHeader className="px-4 py-3 border-b">
                      <DialogTitle className="text-lg">Create New Event</DialogTitle>
                    </DialogHeader>

                    <EventForm
                      isCreate={true}
                      initialEvent={newEvent}
                      onSubmit={handleCreateEvent}
                      onCancel={() => setIsCreateEventOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
                <EventInvitations 
                  initialPendingEvents={pendingInvitations}
                  onEventsUpdate={() => {
                    loadEvents();
                    loadPendingInvitations();
                  }}
                />
              </div>
            </div>

            {/* Bottom Row - Navigation Controls */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentWeek(new Date());
                  setSelectedDate(new Date());
                }}
              >
                Today
              </Button>

              <div className="flex items-center rounded-md border bg-background">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (view === 'week') {
                      setCurrentWeek(subWeeks(currentWeek, 1));
                    } else {
                      setSelectedDate(subDays(selectedDate, 1));
                    }
                  }}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (view === 'week') {
                      setCurrentWeek(addWeeks(currentWeek, 1));
                    } else {
                      setSelectedDate(addDays(selectedDate, 1));
                    }
                  }}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="whitespace-nowrap">
                      {view === 'week' 
                        ? `${format(startOfWeek(currentWeek), 'MMM d')} - ${format(addDays(startOfWeek(currentWeek), 6), 'MMM d')}`
                        : format(selectedDate, 'MMM d, yyyy')
                      }
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="space-y-3 p-3">
                    <Select
                      value={format(view === 'week' ? currentWeek : selectedDate, 'yyyy')}
                      onValueChange={(year) => {
                        const newDate = view === 'week' 
                          ? setYear(currentWeek, parseInt(year))
                          : setYear(selectedDate, parseInt(year));
                        if (view === 'week') {
                          setCurrentWeek(newDate);
                        } else {
                          setSelectedDate(newDate);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() - 5 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    
                    <CalendarPicker
                      mode="single"
                      selected={view === 'week' ? currentWeek : selectedDate}
                      onSelect={(date) => {
                        if (!date) return;
                        if (view === 'week') {
                          setCurrentWeek(date);
                        } else {
                          setSelectedDate(date);
                        }
                      }}
                      initialFocus
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* View Tabs */}
          <div className="px-4 pb-2">
            <TabsList className="w-full sm:w-auto justify-start">
              <TabsTrigger value="day" className="flex-1 sm:flex-none">Day</TabsTrigger>
              <TabsTrigger value="week" className="flex-1 sm:flex-none">Week</TabsTrigger>
              <TabsTrigger value="agenda" className="flex-1 sm:flex-none">Agenda</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <TabsContent value="week" className="absolute inset-0">
            <div 
              className="h-full overflow-auto" 
              ref={weekViewRef}
            >
              <div className="grid grid-cols-[auto_1fr] h-full min-w-[768px]">
                <div className="border-r sticky left-0 bg-background z-10 w-16">
                  <div className="h-[60px] border-b" />
                  {timeSlots.map(hour => (
                    <div 
                      key={hour}
                      className="h-20 border-b px-2 text-xs text-muted-foreground"
                      style={{ paddingTop: '2px' }}
                    >
                      {format(new Date().setHours(hour, 0), 'ha')}
                    </div>
                  ))}
                </div>

                <div>
                  <div className="grid grid-cols-7 border-b sticky top-0 bg-background z-10 h-[60px]">
                    {weekDays.map(day => (
                      <div 
                        key={day.toISOString()}
                        ref={isSameDay(day, new Date()) ? currentDayRef : null}
                        className={cn(
                          "p-2 text-center border-r relative",
                          isSameDay(day, new Date()) && "bg-primary/5"
                        )}
                      >
                        <div className="text-sm font-medium">
                          {format(day, 'EEE')}
                        </div>
                        <div 
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center mx-auto text-sm",
                            isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
                          )}
                        >
                          {format(day, 'd')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    {renderTimeIndicator()}

                    {timeSlots.map(hour => (
                      <div key={hour} className="grid grid-cols-7">
                        {weekDays.map(day => (
                          <div 
                            key={`${day.toISOString()}-${hour}`}
                            className={cn(
                              "h-20 border-r border-b relative group cursor-pointer",
                              "hover:bg-muted/50 transition-colors"
                            )}
                            onClick={() => handleTimeSlotClick(day, hour)}
                          >
                            <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-muted-foreground/20" />
                            
                            {getEventsForDateAndTime(day, hour).map(event => (
                              <WeekEventBlock 
                                key={event.firebaseId || event.id}
                                event={event} 
                                onEventClick={(event) => {
                                  setSelectedEvent(event);
                                  setIsEventDetailsOpen(true);
                                }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="day" className="absolute inset-0">
            <div className="h-full overflow-auto">
              {renderDayView()}
            </div>
          </TabsContent>

          <TabsContent value="agenda" className="absolute inset-0">
            <div className="h-full overflow-auto">
              {renderAgendaView()}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] p-0">
          <DialogHeader className="px-3 py-2 border-b">
            <DialogTitle className="text-base flex items-center gap-2">
              {!isEditing ? (
                <>
                  {selectedEvent?.createdBy !== auth.currentUser?.email && (
                    <div className="w-6 h-6 rounded-full bg-muted overflow-hidden flex-shrink-0">
                      {selectedEvent?.createdByPhotoURL ? (
                        <img 
                          src={selectedEvent.createdByPhotoURL} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          {selectedEvent?.createdBy.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                  {selectedEvent?.title}
                </>
              ) : (
                "Edit Event"
              )}
            </DialogTitle>
          </DialogHeader>

          {isEditing ? (
            <EventForm
              isCreate={false}
              initialEvent={editedEvent || selectedEvent || {}}
              onSubmit={async (event) => {
                if (!selectedEvent?.id) return;
                try {
                  await db.updateCalendarEvent(selectedEvent.id, event);
                  toast({
                    title: "Event Updated",
                    description: "Your changes have been saved"
                  });
                  loadEvents();
                  setIsEditing(false);
                  setEditedEvent(null);
                  setIsEventDetailsOpen(false);
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to update event",
                    variant: "destructive"
                  });
                }
              }}
              onCancel={() => {
                setIsEditing(false);
                setEditedEvent(null);
              }}
            />
          ) : (
            <div className="flex flex-col">
              <div className="p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <ClockIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <div>
                      {selectedEvent?.allDay ? 'All day' : (
                        `${format(selectedEvent?.startDate || new Date(), 'h:mm a')} - 
                         ${format(selectedEvent?.endDate || new Date(), 'h:mm a')}`
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(selectedEvent?.startDate || new Date(), 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>
                </div>

                {selectedEvent?.location && (
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>{selectedEvent.location}</div>
                  </div>
                )}

                {selectedEvent?.description && (
                  <div className="pt-2 border-t">
                    <div className="font-medium mb-1 text-sm">Description</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedEvent.description}
                    </div>
                  </div>
                )}

                {selectedEvent?.sharedWith && selectedEvent.sharedWith.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="font-medium mb-2">Shared with</div>
                    <div className="space-y-2">
                      {selectedEvent.sharedWith.map((share) => (
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

                {selectedEvent?.tags && selectedEvent.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.tags.map(tag => (
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

                <div className="pt-4 border-t">
                  <div className="font-medium mb-2">Reminder</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedEvent?.reminderMinutes 
                      ? `${selectedEvent.reminderMinutes} minutes before`
                      : 'No reminder set'}
                  </div>
                </div>

                <div className="pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Created by</span>
                    <div className="flex items-center gap-1">
                      {selectedEvent?.createdByPhotoURL ? (
                        <img 
                          src={selectedEvent.createdByPhotoURL}
                          alt=""
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px]">
                          {selectedEvent?.createdBy.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{selectedEvent?.createdBy}</span>
                    </div>
                  </div>
                  {selectedEvent?.lastModifiedBy && selectedEvent.lastModifiedBy !== selectedEvent.createdBy && (
                    <div className="flex items-center gap-2 mt-1">
                      <span>Last modified by</span>
                      <div className="flex items-center gap-1">
                        {selectedEvent.lastModifiedByPhotoURL ? (
                          <img 
                            src={selectedEvent.lastModifiedByPhotoURL}
                            alt=""
                            className="w-4 h-4 rounded-full"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px]">
                            {selectedEvent.lastModifiedBy.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>{selectedEvent.lastModifiedByDisplayName || selectedEvent.lastModifiedBy}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t p-3 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEventDetailsOpen(false)}>
                  Close
                </Button>
                {(selectedEvent?.createdBy === auth.currentUser?.email || 
                  selectedEvent?.sharedWith?.some(share => 
                    share.email === auth.currentUser?.email && share.permission === 'edit'
                  )) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreate(false);
                      setEditedEvent(selectedEvent);
                      setIsEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
                {selectedEvent?.createdBy === auth.currentUser?.email && (
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (selectedEvent?.id) {
                        await db.deleteCalendarEvent(selectedEvent.id);
                        loadEvents();
                        setIsEventDetailsOpen(false);
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Event</DialogTitle>
            <DialogDescription>
              Share this event with others via email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Email Addresses</Label>
              <Textarea
                placeholder="Enter email addresses (one per line)"
                value={shareEmails}
                onChange={(e) => setShareEmails(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate multiple emails with new lines
              </p>
            </div>

            <div>
              <Label>Permission</Label>
              <Select
                value={sharePermission}
                onValueChange={(value) => setSharePermission(value as 'view' | 'edit')}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Can view</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedEvent?.sharedWith && selectedEvent.sharedWith.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <Label>Currently shared with</Label>
                <div className="mt-2 space-y-2">
                  {selectedEvent.sharedWith.map((share) => (
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsShareDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedEvent?.id) return;
                  
                  try {
                    const emails = shareEmails
                      .split('\n')
                      .map(email => email.trim())
                      .filter(Boolean);
                    
                    await db.shareCalendarEvent(selectedEvent?.id, emails, sharePermission);
                    
                    toast({
                      title: "Event Shared",
                      description: `Event shared with ${emails.length} people`
                    });
                    
                    setIsShareDialogOpen(false);
                    loadEvents();
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to share event",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 