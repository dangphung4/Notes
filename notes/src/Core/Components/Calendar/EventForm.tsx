/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TagSelector } from '@/components/TagSelector';
import { auth } from '../../Auth/firebase';
import { db } from '../../Database/db';
import { format } from 'date-fns';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { MapPinIcon, ChevronRightIcon, ClockIcon, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimePicker } from './TimePicker';
import type { CalendarEvent, Tags } from '../../Database/db';

interface EventFormProps {
  isCreate: boolean;
  initialEvent: Partial<CalendarEvent>;
  onSubmit: (event: Partial<CalendarEvent>) => void;
  onCancel: () => void;
}

export const EventForm = ({ isCreate, initialEvent, onSubmit, onCancel }: EventFormProps) => {
  const [event, setEvent] = useState(initialEvent);
  const [showMore, setShowMore] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const handleCreateTag = async (tag: Partial<Tags>) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const newTag: Partial<Tags> = {
      ...tag,
      createdBy: user.email || '',
      createdAt: new Date()
    };

    return await db.createTag(newTag);
  };

  const presetColors = [
    '#3b82f6', '#60a5fa', '#2563eb', // Blues
    '#ef4444', '#f87171', '#dc2626', // Reds
    '#22c55e', '#4ade80', '#16a34a', // Greens
    '#f59e0b', '#fbbf24', '#d97706', // Yellows/Oranges
    '#6366f1', '#a855f7', '#7c3aed', // Purples
    '#ec4899', '#f472b6', '#db2777', // Pinks
    '#6b7280', '#4b5563', '#374151', // Grays
    '#14b8a6', '#2dd4bf', '#0d9488', // Teals
  ];

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
                  onChange={e => setEvent((prev: any) => ({ ...prev, color: e.target.value }))}
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
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Tags</Label>
              <TagSelector
                selectedTags={event.tags || []}
                onTagsChange={tags => setEvent({ ...event, tags })}
                onCreateTag={handleCreateTag}
              />
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
          onClick={() => onSubmit(event)}
        >
          {isCreate ? 'Save' : 'Update'}
        </Button>
      </div>
    </div>
  );
}; 