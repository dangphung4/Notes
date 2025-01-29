import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { db } from '../Database/db';
import type { CalendarEvent } from '../Types/CalendarEvent';
import { PlusIcon, MapPinIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, Share2Icon, UserPlusIcon, X } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns";
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

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    const allEvents = await db.calendarEvents.toArray();
    setEvents(allEvents);
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const eventToCreate = {
        ...newEvent,
        createdBy: user.email || '',
        lastModifiedBy: user.email || '',
        lastModifiedAt: new Date()
      } as CalendarEvent;

      await db.createCalendarEvent(eventToCreate);
      
      if (eventToCreate.sharedWith && eventToCreate.sharedWith.length > 0) {
        const emails = eventToCreate.sharedWith.map(share => share.email);
        await db.shareCalendarEvent(
          eventToCreate.id!,
          emails,
          eventToCreate.sharedWith[0].permission
        );
      }

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
  }

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
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="space-y-4 p-4">
        {events
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .map(event => (
            <div
              key={event.id}
              className="rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
              onClick={() => handleEventClick(event)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(event.startDate), 'EEEE, MMMM d')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.allDay ? 'All day' : 
                      `${format(new Date(event.startDate), 'h:mm a')} - 
                       ${format(new Date(event.endDate), 'h:mm a')}`
                    }
                  </p>
                </div>
                {event.color && (
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                )}
              </div>
              {event.location && (
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <MapPinIcon className="h-4 w-4" />
                  {event.location}
                </div>
              )}
            </div>
          ))}
      </div>
    </ScrollArea>
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
                  <div
                    key={event.id}
                    className="absolute inset-x-1 rounded p-2 text-sm hover:ring-2 hover:ring-primary"
                    style={{
                      backgroundColor: event.color + '33',
                      borderLeft: `3px solid ${event.color}`,
                      top: '4px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                  >
                    <div className="font-medium">{event.title}</div>
                    {event.location && (
                      <div className="text-xs text-muted-foreground truncate">
                        {event.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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

  const timeOptions = generateTimeOptions();

  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<CalendarEvent> | null>(null);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <Tabs 
        defaultValue="week" 
        value={view} 
        onValueChange={(v) => setView(v as typeof view)} 
        className="flex flex-col h-full"
      >
        <div className="shrink-0 border-b bg-background">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Calendar</h1>
              <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-[525px] h-[95vh] sm:h-auto p-0">
                  <DialogHeader className="sticky top-0 bg-background z-10 p-6 pb-4 border-b">
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                      Add a new event to your calendar
                    </DialogDescription>
                  </DialogHeader>

                  <div className="px-6 py-4 overflow-y-auto max-h-[calc(95vh-8rem)]">
                    <form onSubmit={handleCreateEvent} className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input 
                            value={newEvent.title}
                            onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                            placeholder="Event title"
                            className="mt-1.5"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={newEvent.allDay}
                            onCheckedChange={checked => setNewEvent({...newEvent, allDay: checked})}
                            id="all-day"
                          />
                          <Label htmlFor="all-day">All day</Label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start</Label>
                            <div className="flex flex-col gap-2">
                              <Input 
                                type="date"
                                value={format(newEvent.startDate || new Date(), 'yyyy-MM-dd')}
                                onChange={e => {
                                  const date = new Date(e.target.value);
                                  const current = new Date(newEvent.startDate || new Date());
                                  date.setHours(current.getHours(), current.getMinutes());
                                  setNewEvent({...newEvent, startDate: date});
                                }}
                              />
                              <Select
                                value={format(newEvent.startDate || new Date(), 'HH:mm')}
                                onValueChange={(time) => {
                                  const [hours, minutes] = time.split(':').map(Number);
                                  const newDate = new Date(newEvent.startDate || new Date());
                                  newDate.setHours(hours, minutes);
                                  setNewEvent({...newEvent, startDate: newDate});
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                  {generateTimeOptions().map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>End</Label>
                            <div className="flex flex-col gap-2">
                              <Input 
                                type="date"
                                value={format(newEvent.endDate || new Date(), 'yyyy-MM-dd')}
                                onChange={e => {
                                  const date = new Date(e.target.value);
                                  const currentEnd = new Date(newEvent.endDate || new Date());
                                  date.setHours(currentEnd.getHours(), currentEnd.getMinutes());
                                  setNewEvent({...newEvent, endDate: date});
                                }}
                              />
                              <Select
                                value={format(newEvent.endDate || new Date(), 'HH:mm')}
                                onValueChange={(time) => {
                                  const [hours, minutes] = time.split(':').map(Number);
                                  const newDate = new Date(newEvent.endDate || new Date());
                                  newDate.setHours(hours, minutes);
                                  setNewEvent({...newEvent, endDate: newDate});
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                  {generateTimeOptions().map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label>Location</Label>
                          <Input 
                            value={newEvent.location || ''}
                            onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                            placeholder="Add location"
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea 
                            value={newEvent.description || ''}
                            onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                            placeholder="Add description"
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label>Color</Label>
                          <div className="flex gap-2 mt-1.5">
                            {['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#6366f1'].map(color => (
                              <button
                                key={color}
                                type="button"
                                className={cn(
                                  "w-6 h-6 rounded-full",
                                  newEvent.color === color && "ring-2 ring-offset-2 ring-primary"
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => setNewEvent({...newEvent, color})}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label>Reminder</Label>
                          <Select
                            value={newEvent.reminderMinutes?.toString()}
                            onValueChange={(value) => setNewEvent({...newEvent, reminderMinutes: parseInt(value)})}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue placeholder="Select reminder time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">At time of event</SelectItem>
                              <SelectItem value="5">5 minutes before</SelectItem>
                              <SelectItem value="15">15 minutes before</SelectItem>
                              <SelectItem value="30">30 minutes before</SelectItem>
                              <SelectItem value="60">1 hour before</SelectItem>
                              <SelectItem value="1440">1 day before</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Participants</Label>
                          <div className="flex gap-2 mt-1.5">
                            <Input
                              placeholder="Enter email address"
                              value={newParticipant}
                              onChange={(e) => setNewParticipant(e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (newParticipant && newParticipant.includes('@')) {
                                  setNewEvent({
                                    ...newEvent,
                                    sharedWith: [
                                      ...(newEvent.sharedWith || []),
                                      {
                                        email: newParticipant,
                                        permission: 'view',
                                        status: 'pending'
                                      }
                                    ]
                                  });
                                  setNewParticipant('');
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                          
                          {newEvent.sharedWith && newEvent.sharedWith.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {newEvent.sharedWith.map((participant, index) => (
                                <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded-md">
                                  <div className="flex items-center gap-2">
                                    <UserPlusIcon className="h-4 w-4 text-muted-foreground" />
                                    <span>{participant.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={participant.permission}
                                      onValueChange={(value: 'view' | 'edit') => {
                                        const updatedSharedWith = [...(newEvent.sharedWith || [])];
                                        updatedSharedWith[index] = {
                                          ...participant,
                                          permission: value
                                        };
                                        setNewEvent({
                                          ...newEvent,
                                          sharedWith: updatedSharedWith
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="h-7 w-[100px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="view">Can view</SelectItem>
                                        <SelectItem value="edit">Can edit</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => {
                                        const updatedSharedWith = newEvent.sharedWith?.filter((_, i) => i !== index);
                                        setNewEvent({
                                          ...newEvent,
                                          sharedWith: updatedSharedWith
                                        });
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="sticky bottom-0 bg-background p-6 pt-4 border-t mt-auto">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Event</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center mr-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentWeek(new Date())}
                >
                  Today
                </Button>
              </div>
              <div className="flex items-center rounded-md border bg-background">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-none"
                  onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-none"
                  onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="hidden sm:block min-w-[150px] text-sm font-medium">
                {format(startOfWeek(currentWeek), 'MMMM yyyy')}
              </div>
            </div>
          </div>

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
                              <div
                                key={event.id}
                                className={cn(
                                  "absolute inset-x-1 rounded-sm p-1 text-xs",
                                  "hover:ring-2 hover:ring-primary cursor-pointer",
                                  "transition-all duration-200"
                                )}
                                style={{
                                  backgroundColor: event.color + '33',
                                  borderLeft: `3px solid ${event.color}`,
                                  top: '2px',
                                  minHeight: '18px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event);
                                }}
                              >
                                <div className="font-medium truncate">{event.title}</div>
                                {event.location && (
                                  <div className="truncate text-muted-foreground">
                                    {event.location}
                                  </div>
                                )}
                              </div>
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
        <DialogContent className="max-w-[95vw] sm:max-w-[525px] h-[95vh] sm:h-auto p-0">
          <DialogHeader className="sticky top-0 bg-background z-10 p-6 pb-4 border-b">
            <DialogTitle>
              {!isEditing ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedEvent?.color }}
                  />
                  {selectedEvent?.title}
                </div>
              ) : (
                "Edit Event"
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(95vh-8rem)]">
            {!isEditing ? (
              <>
                <div className="flex items-start gap-2">
                  <ClockIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
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
                    <MapPinIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>{selectedEvent.location}</div>
                  </div>
                )}

                {selectedEvent?.description && (
                  <div className="pt-4 border-t">
                    <div className="font-medium mb-2">Description</div>
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

                <div className="pt-4 border-t">
                  <div className="font-medium mb-2">Reminder</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedEvent?.reminderMinutes 
                      ? `${selectedEvent.reminderMinutes} minutes before`
                      : 'No reminder set'}
                  </div>
                </div>

                <div className="pt-4 border-t text-sm text-muted-foreground">
                  <div>Created by {selectedEvent?.createdBy}</div>
                  {selectedEvent?.lastModifiedBy && (
                    <div>Last modified by {selectedEvent.lastModifiedBy}</div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Start</Label>
                    <div className="flex flex-col gap-2 mt-1.5">
                      <Input 
                        type="date"
                        value={format(editedEvent?.startDate || new Date(), 'yyyy-MM-dd')}
                        onChange={e => {
                          const date = new Date(e.target.value);
                          const current = new Date(editedEvent?.startDate || new Date());
                          date.setHours(current.getHours(), current.getMinutes());
                          setEditedEvent({...editedEvent, startDate: date});
                        }}
                      />
                      <Select
                        value={format(editedEvent?.startDate || new Date(), 'HH:mm')}
                        onValueChange={(time) => {
                          const [hours, minutes] = time.split(':').map(Number);
                          const newDate = new Date(editedEvent?.startDate || new Date());
                          newDate.setHours(hours, minutes);
                          setEditedEvent({...editedEvent, startDate: newDate});
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {generateTimeOptions().map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>End</Label>
                    <div className="flex flex-col gap-2 mt-1.5">
                      <Input 
                        type="date"
                        value={format(editedEvent?.endDate || new Date(), 'yyyy-MM-dd')}
                        onChange={e => {
                          const date = new Date(e.target.value);
                          const current = new Date(editedEvent?.endDate || new Date());
                          date.setHours(current.getHours(), current.getMinutes());
                          setEditedEvent({...editedEvent, endDate: date});
                        }}
                      />
                      <Select
                        value={format(editedEvent?.endDate || new Date(), 'HH:mm')}
                        onValueChange={(time) => {
                          const [hours, minutes] = time.split(':').map(Number);
                          const newDate = new Date(editedEvent?.endDate || new Date());
                          newDate.setHours(hours, minutes);
                          setEditedEvent({...editedEvent, endDate: newDate});
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {generateTimeOptions().map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Location</Label>
                  <Input 
                    value={editedEvent?.location || ''}
                    onChange={e => setEditedEvent({...editedEvent, location: e.target.value})}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={editedEvent?.description || ''}
                    onChange={e => setEditedEvent({...editedEvent, description: e.target.value})}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-1.5">
                    {['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#6366f1'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "w-6 h-6 rounded-full",
                          editedEvent?.color === color && "ring-2 ring-offset-2 ring-primary"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditedEvent({...editedEvent, color})}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 bg-background p-6 pt-4 border-t">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                      setEditedEvent(null);
                    } else {
                      setIsEventDetailsOpen(false);
                    }
                  }}
                >
                  {isEditing ? 'Cancel' : 'Close'}
                </Button>
                
                {(selectedEvent?.createdBy === auth.currentUser?.email || 
                 selectedEvent?.sharedWith?.some(share => 
                   share.email === auth.currentUser?.email && share.permission === 'edit'
                 )) && (
                  isEditing ? (
                    <Button
                      onClick={async () => {
                        if (!editedEvent || !selectedEvent?.id) return;
                        
                        try {
                          await db.updateCalendarEvent(selectedEvent.id, editedEvent);
                          toast({
                            title: "Event Updated",
                            description: "Your changes have been saved"
                          });
                          loadEvents();
                          setIsEditing(false);
                          setEditedEvent(null);
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update event",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditedEvent(selectedEvent);
                        setIsEditing(true);
                      }}
                    >
                      Edit
                    </Button>
                  )
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
                    Delete Event
                  </Button>
                )}
              </div>
            </div>
          </div>
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
                    
                    await db.shareCalendarEvent(selectedEvent.id, emails, sharePermission);
                    
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