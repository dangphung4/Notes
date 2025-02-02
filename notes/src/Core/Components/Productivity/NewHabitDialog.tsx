import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { db } from '../../Database/db';
import { useToast } from "@/hooks/use-toast";

interface NewHabitDialogProps {
  onHabitCreated: () => void;
}

export function NewHabitDialog({ onHabitCreated }: NewHabitDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [targetCount, setTargetCount] = useState<number>(1);
  const [reminderTime, setReminderTime] = useState<string>('');

  const handleSubmit = async () => {
    try {
      await db.createHabit({
        habitName,
        description,
        frequency,
        targetCount,
        reminderTime,
        startDate: new Date(),
        completedDates: []
      });

      toast({
        title: "Habit Created",
        description: "Your new habit has been created successfully.",
      });

      setOpen(false);
      resetForm();
      onHabitCreated();
    } catch (error) {
      console.error('Error creating habit:', error);
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setHabitName('');
    setDescription('');
    setFrequency('daily');
    setTargetCount(1);
    setReminderTime('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add New Habit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
          <DialogDescription>
            Add a new habit to track and build consistency.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="habitName">Habit Name</Label>
            <Input
              id="habitName"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="Enter habit name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter habit description"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select 
              value={frequency} 
              onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setFrequency(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="targetCount">Target Count</Label>
            <Input
              id="targetCount"
              type="number"
              min="1"
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value))}
              placeholder="How many times per period?"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reminderTime">Reminder Time (Optional)</Label>
            <Input
              id="reminderTime"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!habitName}>
            Create Habit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 