import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db, Task, HabitTracker, PomodoroSession, DailyProgress } from '../Database/db';
import { useAuth } from '../Auth/AuthContext';
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Timer, BarChart2, Calendar as CalendarIcon, Filter, Bell, BellOff, Settings, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { NewTaskDialog } from '../Components/Productivity/NewTaskDialog';
import { NewHabitDialog } from '../Components/Productivity/NewHabitDialog';
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Target, TrendingUp } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import React from 'react';

interface DayWithActivity {
  date: Date;
  hasPomodoros: boolean;
  hasTasks: boolean;
  hasHabits: boolean;
}

interface DayProps {
  date: Date;
  selected?: boolean;
  today?: boolean;
  disabled?: boolean;
}

const TimerSettingsModal = ({
  open,
  onOpenChange,
  workDuration,
  shortBreak,
  longBreak,
  onWorkDurationChange,
  onShortBreakChange,
  onLongBreakChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  onWorkDurationChange: (value: number) => void;
  onShortBreakChange: (value: number) => void;
  onLongBreakChange: (value: number) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px] p-6">
      <DialogHeader className="space-y-3">
        <DialogTitle className="text-2xl">Timer Settings</DialogTitle>
        <DialogDescription className="text-base">
          Customize your Pomodoro timer durations
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 py-6">
        <div className="grid gap-3">
          <Label htmlFor="workDuration" className="text-base">Work Duration (minutes)</Label>
          <Input
            id="workDuration"
            type="number"
            value={workDuration}
            onChange={(e) => onWorkDurationChange(Number(e.target.value))}
            min={1}
            className="h-11"
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="shortBreak" className="text-base">Short Break (minutes)</Label>
          <Input
            id="shortBreak"
            type="number"
            value={shortBreak}
            onChange={(e) => onShortBreakChange(Number(e.target.value))}
            min={1}
            className="h-11"
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="longBreak" className="text-base">Long Break (minutes)</Label>
          <Input
            id="longBreak"
            type="number"
            value={longBreak}
            onChange={(e) => onLongBreakChange(Number(e.target.value))}
            min={1}
            className="h-11"
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-11">
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const StatCard = ({ icon: Icon, label, value, total, color, className, labelClassName, valueClassName }: { 
  icon: LucideIcon, 
  label: string, 
  value: number, 
  total?: number,
  color: string,
  className?: string,
  labelClassName?: string,
  valueClassName?: string
}) => (
  <div className={cn(
    "relative overflow-hidden rounded-xl border bg-background p-4 hover:bg-muted/50 transition-colors",
    className
  )}>
    <div className="flex items-center gap-4">
      <div className={cn(
        "rounded-full p-2.5",
        `bg-${color}-500/10 text-${color}-500`
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className={cn("text-sm font-medium text-muted-foreground", labelClassName)}>{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={cn("text-2xl font-bold", valueClassName)}>{value}</p>
          {total && <p className="text-sm text-muted-foreground">/ {total}</p>}
        </div>
      </div>
    </div>
  </div>
);

export function ProductivityDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activePomodoro, setActivePomodoro] = useState<PomodoroSession | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<HabitTracker[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [taskFilter, setTaskFilter] = useState<'all' | 'today' | 'week'>('all');
  const [taskSort, setTaskSort] = useState<'priority' | 'dueDate'>('priority');
  const [searchQuery, setSearchQuery] = useState('');
  const [customWorkDuration, setCustomWorkDuration] = useState(25);
  const [customShortBreak, setCustomShortBreak] = useState(5);
  const [customLongBreak, setCustomLongBreak] = useState(15);
  const [pomodoroType, setPomodoroType] = useState<'work' | 'short-break' | 'long-break'>('work');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [daysWithActivity, setDaysWithActivity] = useState<DayWithActivity[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    }
  }, []);

  useEffect(() => {
    if (activePomodoro) {
      document.title = `(${formatTime(timeLeft)}) Pomodoro - Notes`;
    } else {
      document.title = 'Notes';
    }
    return () => {
      document.title = 'Notes';
    };
  }, [timeLeft, activePomodoro]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' && !activePomodoro) {
        e.preventDefault();
        startPomodoro('work');
      } else if (e.code === 'KeyP' && activePomodoro) {
        e.preventDefault();
        completePomodoro();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activePomodoro]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activePomodoro) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activePomodoro.startTime.getTime()) / 1000);
        const total = activePomodoro.duration * 60;
        const remaining = Math.max(0, total - elapsed);
        setTimeLeft(remaining);

        if (remaining === 0) {
          completePomodoro();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activePomodoro]);

  const loadProgressForDate = async (date: Date) => {
    if (!user) return;

    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      // Load daily progress for selected date
      const progress = await db.dailyProgress
        .where('createdBy')
        .equals(user.email || '')
        .and(p => p.date.toDateString() === targetDate.toDateString())
        .first();

      // Load completed tasks for selected date
      const completedTasks = await db.tasks
        .where('createdBy')
        .equals(user.email || '')
        .and(task => {
          if (!task.completedAt) return false;
          const taskDate = new Date(task.completedAt);
          return taskDate.toDateString() === targetDate.toDateString();
        })
        .toArray();

      // Load completed habits for selected date
      const completedHabits = habits.filter(habit =>
        habit.completedDates?.some(d => 
          new Date(d).toDateString() === targetDate.toDateString()
        )
      );

      // Load pomodoro sessions for selected date
      const sessions = await db.pomodoroSessions
        .where('createdBy')
        .equals(user.email || '')
        .and(session => {
          const sessionDate = new Date(session.startTime);
          return sessionDate.toDateString() === targetDate.toDateString();
        })
        .toArray();

      setDailyProgress(progress || {
        date: targetDate,
        pomodorosCompleted: sessions.length,
        tasksCompleted: completedTasks.length,
        habitsCompleted: completedHabits.length,
        totalWorkMinutes: sessions.reduce((total, session) => total + (session.duration || 0), 0),
        createdBy: user.email || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error loading progress for date:', error);
      toast({
        title: "Error",
        description: "Failed to load progress for selected date",
        variant: "destructive"
      });
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      // Load active pomodoro session
      const activeSessions = await db.pomodoroSessions
        .where('status')
        .equals('active')
        .and(session => session.createdBy === user.email)
        .toArray();
      
      if (activeSessions.length > 0) {
        setActivePomodoro(activeSessions[0]);
        const elapsed = Math.floor((Date.now() - activeSessions[0].startTime.getTime()) / 1000);
        const total = activeSessions[0].duration * 60;
        setTimeLeft(Math.max(0, total - elapsed));
      }

      // Load all tasks (including completed ones)
      const userTasks = await db.tasks
        .where('createdBy')
        .equals(user.email || '')
        .toArray();
      setTasks(userTasks);

      // Load habits
      const userHabits = await db.habitTrackers
        .where('createdBy')
        .equals(user.email || '')
        .toArray();
      setHabits(userHabits);

      // Load progress for selected date
      await loadProgressForDate(selectedDate);
    } catch (error) {
      console.error('Error loading productivity data:', error);
      toast({
        title: "Error",
        description: "Failed to load productivity data",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadProgressForDate(selectedDate);
  }, [selectedDate, user?.email]);

  const startPomodoro = async (type: 'work' | 'short-break' | 'long-break') => {
    try {
      const duration = type === 'work' ? customWorkDuration : 
                      type === 'short-break' ? customShortBreak : customLongBreak;
      
      setPomodoroType(type);
      const session = await db.startPomodoroSession({
        duration,
        type,
        startTime: new Date(),
        status: 'active',
        createdBy: user?.email || '',
        createdAt: new Date()
      });

      setActivePomodoro(session);
      setTimeLeft(duration * 60);

      toast({
        title: "Pomodoro Started",
        description: `${duration} minute ${type.replace('-', ' ')} session started`,
      });
    } catch (error) {
      console.error('Error starting pomodoro:', error);
      toast({
        title: "Error",
        description: "Failed to start pomodoro session",
        variant: "destructive"
      });
    }
  };

  const completePomodoro = async () => {
    if (!activePomodoro) return;

    try {
      await db.completePomodoroSession(activePomodoro.id!);
      setActivePomodoro(null);
      await loadData();

      showNotification(
        "Pomodoro Completed",
        "Great job! Time for a break."
      );

      toast({
        title: "Pomodoro Completed",
        description: "Great job! Take a break.",
      });
    } catch (error) {
      console.error('Error completing pomodoro:', error);
      toast({
        title: "Error",
        description: "Failed to complete pomodoro session",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateProgress = (): number => {
    if (!dailyProgress) return 0;
    const targetPomodoros = 8; // Example target
    return Math.min(100, (dailyProgress.pomodorosCompleted / targetPomodoros) * 100);
  };

  const handleTaskComplete = async (taskId: number) => {
    try {
      await db.updateTask(taskId, {
        status: 'completed',
        completedAt: new Date()
      });
      await loadData();
      
      toast({
        title: "Task Completed",
        description: "Great job completing your task!",
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  const handleHabitComplete = async (habitId: number) => {
    try {
      await db.completeHabit(habitId);
      await loadData();
      
      toast({
        title: "Habit Completed",
        description: "Keep up the good work!",
      });
    } catch (error) {
      console.error('Error completing habit:', error);
      toast({
        title: "Error",
        description: "Failed to complete habit",
        variant: "destructive"
      });
    }
  };

  const handleDeleteHabit = async (habitId: number) => {
    try {
      await db.habitTrackers.delete(habitId);
      await loadData();
      
      toast({
        title: "Habit Deleted",
        description: "Habit has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: "Error",
        description: "Failed to delete habit",
        variant: "destructive"
      });
    }
  };

  const isHabitCompletedOnDate = (habit: HabitTracker, date: Date): boolean => {
    const dateStr = date.toDateString();
    return habit.completedDates.some(d => 
      new Date(d).toDateString() === dateStr
    );
  };

  const filteredTasks = tasks.filter(task => {
    // First apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
      if (!matches) return false;
    }

    const taskDate = task.dueDate ? new Date(task.dueDate) : null;
    const selectedDateStr = selectedDate.toDateString();
    const today = new Date().toDateString();
    
    if (taskFilter === 'today') {
      // For 'today' filter, show:
      // 1. Tasks due today (regardless of completion)
      // 2. Tasks completed today
      return (
        (taskDate?.toDateString() === today) || 
        (task.completedAt && new Date(task.completedAt).toDateString() === today)
      );
    }
    
    if (taskFilter === 'week') {
      const weekFromNow = new Date();
      weekFromNow.setDate(new Date().getDate() + 7);
      // For 'week' filter, show:
      // 1. Incomplete tasks due within the next 7 days
      // 2. Tasks completed within the selected week
      return (
        (taskDate && taskDate >= new Date() && taskDate <= weekFromNow && task.status !== 'completed') ||
        (task.completedAt && new Date(task.completedAt) >= new Date() && new Date(task.completedAt) <= weekFromNow)
      );
    }

    // For 'all' filter, show:
    // 1. All incomplete tasks
    // 2. Tasks completed on the selected date
    return (
      task.status !== 'completed' ||
      (task.completedAt && new Date(task.completedAt).toDateString() === selectedDateStr)
    );
  }).sort((a, b) => {
    if (taskSort === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (taskSort === 'dueDate' && a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(console.error);
    }
  }, [soundEnabled]);

  const showNotification = useCallback((title: string, body: string) => {
    if (notificationsEnabled && document.hidden) {
      new Notification(title, { body });
      playNotificationSound();
    }
  }, [notificationsEnabled, playNotificationSound]);

  const loadMonthActivity = async (month: Date) => {
    if (!user?.email) return;

    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    try {
      // Load all daily progress for the month
      const progress = await db.dailyProgress
        .where('createdBy')
        .equals(user.email)
        .and(p => {
          const date = new Date(p.date);
          return date >= startOfMonth && date <= endOfMonth;
        })
        .toArray();

      const activityDays = progress.map(p => ({
        date: new Date(p.date),
        hasPomodoros: (p.pomodorosCompleted || 0) > 0,
        hasTasks: (p.tasksCompleted || 0) > 0,
        hasHabits: (p.habitsCompleted || 0) > 0
      }));

      setDaysWithActivity(activityDays);
    } catch (error) {
      console.error('Error loading month activity:', error);
    }
  };

  useEffect(() => {
    loadMonthActivity(selectedDate);
  }, [selectedDate, user?.email]);

  const CustomDay = ({ date, selected, today, disabled }: DayProps & { onClick?: () => void }) => {
    const activity = daysWithActivity.find(d => 
      d.date.toDateString() === date.toDateString()
    );

    const isFutureDate = date > new Date();
    const isDisabled = disabled || isFutureDate;

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabled) {
        setSelectedDate(date);
      }
    };

    return (
      <button
        onClick={handleClick}
        disabled={isDisabled}
        type="button"
        className={cn(
          "w-full h-full",
          "flex flex-col items-center justify-center gap-1",
          "rounded-md transition-all duration-200",
          "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
          selected && "bg-primary hover:bg-primary/90",
          today && !selected && "border-2 border-primary",
          isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
          !isDisabled && !selected && activity && "bg-muted/30",
          "disabled:pointer-events-none"
        )}
      >
        <span className={cn(
          "text-base font-medium",
          selected && "text-primary-foreground",
          !selected && isDisabled && "text-muted-foreground",
          !selected && !isDisabled && "text-foreground"
        )}>
          {date.getDate()}
        </span>
        {activity && (
          <div className="flex gap-1">
            {activity.hasPomodoros && (
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                selected ? "bg-primary-foreground/70" : "bg-blue-500"
              )} />
            )}
            {activity.hasTasks && (
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                selected ? "bg-primary-foreground/70" : "bg-green-500"
              )} />
            )}
            {activity.hasHabits && (
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                selected ? "bg-primary-foreground/70" : "bg-purple-500"
              )} />
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-6 md:py-8 max-w-7xl"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Productivity Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and build better habits</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Disable sound" : "Enable sound"}
              className="h-11 w-11 transition-transform hover:scale-105"
            >
              {soundEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </Button>
          </div>
          <div className="flex gap-3 flex-1 md:flex-none">
            <NewTaskDialog onTaskCreated={loadData} />
            <NewHabitDialog onHabitCreated={loadData} />
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard 
          icon={Timer} 
          label="Focus Time Today" 
          value={dailyProgress?.totalWorkMinutes || 0} 
          color="blue"
          className="p-3 sm:p-4"
          labelClassName="text-xs sm:text-sm"
          valueClassName="text-lg sm:text-2xl"
        />
        <StatCard 
          icon={Target} 
          label="Tasks Completed" 
          value={dailyProgress?.tasksCompleted || 0} 
          color="green"
          className="p-3 sm:p-4"
          labelClassName="text-xs sm:text-sm"
          valueClassName="text-lg sm:text-2xl"
        />
        <StatCard 
          icon={Sparkles} 
          label="Habits Streak" 
          value={Math.max(...habits.map(h => h.currentStreak), 0)}
          color="purple"
          className="p-3 sm:p-4"
          labelClassName="text-xs sm:text-sm"
          valueClassName="text-lg sm:text-2xl"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Pomodoros" 
          value={dailyProgress?.pomodorosCompleted || 0} 
          total={8}
          color="orange"
          className="p-3 sm:p-4"
          labelClassName="text-xs sm:text-sm"
          valueClassName="text-lg sm:text-2xl"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pomodoro Timer Card */}
        <Card className="col-span-1 border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="space-y-3 pb-6">
            <motion.div 
              className="flex justify-between items-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <CardTitle className="flex items-center gap-3 text-xl">
                <Timer className="h-6 w-6" />
                Pomodoro Timer
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTimerModalOpen(true)}
                title="Timer Settings"
                className="h-10 w-10 transition-transform hover:scale-110"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </motion.div>
            <CardDescription className="text-base">Focus on your work in timed sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-8">
              <motion.div 
                className="w-48 h-48 md:w-56 md:h-56"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <CircularProgressbar
                  value={activePomodoro ? (timeLeft / (activePomodoro.duration * 60)) * 100 : 0}
                  text={activePomodoro ? formatTime(timeLeft) : '00:00'}
                  styles={buildStyles({
                    pathColor: pomodoroType === 'work' ? '#ef4444' : '#22c55e',
                    textColor: 'currentColor',
                    trailColor: 'rgba(0,0,0,0.1)',
                    textSize: '20px',
                    pathTransitionDuration: 0.3,
                    strokeLinecap: 'round',
                  })}
                />
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div 
                  className="flex flex-wrap justify-center gap-3 w-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {!activePomodoro ? (
                    <>
                      <Button 
                        onClick={() => startPomodoro('work')} 
                        variant="default"
                        className="flex-1 h-11 min-w-[130px] max-w-[200px] transition-transform hover:scale-105"
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        Work ({customWorkDuration}m)
                      </Button>
                      <Button 
                        onClick={() => startPomodoro('short-break')} 
                        variant="outline"
                        className="flex-1 h-11 min-w-[130px] max-w-[200px] transition-transform hover:scale-105"
                      >
                        Short ({customShortBreak}m)
                      </Button>
                      <Button 
                        onClick={() => startPomodoro('long-break')} 
                        variant="outline"
                        className="flex-1 h-11 min-w-[130px] max-w-[200px] transition-transform hover:scale-105"
                      >
                        Long ({customLongBreak}m)
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={completePomodoro} 
                      variant="destructive"
                      className="w-full h-11 max-w-[200px] transition-transform hover:scale-105"
                    >
                      Stop Timer
                    </Button>
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="text-sm text-muted-foreground text-center bg-muted/50 px-4 py-2 rounded-lg">
                <p>Press <kbd className="px-2 py-0.5 bg-background rounded border mx-1">Space</kbd> to start/stop timer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Progress Card */}
        <Card className="col-span-1 border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <BarChart2 className="h-6 w-6" />
              Today's Progress
            </CardTitle>
            <CardDescription className="text-base">Track your daily achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="font-medium flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Pomodoros
                    </span>
                    <span>{dailyProgress?.pomodorosCompleted || 0}/8</span>
                  </div>
                  <Progress 
                    value={calculateProgress()} 
                    className="h-3 transition-all" 
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Tasks
                    </span>
                    <span className="text-muted-foreground">{dailyProgress?.tasksCompleted || 0}</span>
                  </div>
                  <Progress 
                    value={(dailyProgress?.tasksCompleted || 0) * 10} 
                    className="h-3 transition-all" 
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Habits
                    </span>
                    <span className="text-muted-foreground">
                      {dailyProgress?.habitsCompleted || 0}/{habits.length}
                    </span>
                  </div>
                  <Progress 
                    value={habits.length > 0 ? ((dailyProgress?.habitsCompleted || 0) / habits.length) * 100 : 0} 
                    className="h-3 transition-all" 
                  />
                </div>
              </motion.div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Focus Time
                  </span>
                  <span className="text-2xl font-semibold">{dailyProgress?.totalWorkMinutes || 0}m</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View Card */}
        <Card className="col-span-1 border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <CalendarIcon className="h-6 w-6" />
              Progress Calendar
            </CardTitle>
            <CardDescription className="text-base">View your productivity history</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-y bg-muted/50">
              <div className="overflow-hidden">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={{ after: new Date() }}
                  initialFocus
                  components={{
                    Day: CustomDay
                  }}
                  className="w-full"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4 w-full",
                    caption: "flex justify-center pt-1 relative items-center mb-4",
                    caption_label: "text-base font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-9 w-9 bg-transparent p-0 hover:bg-muted rounded-md transition-colors disabled:opacity-50",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md w-full font-normal text-sm",
                    row: "flex w-full mt-2",
                    cell: "relative w-full h-[45px] sm:h-[60px] p-0.5",
                    day: "h-full rounded-md focus-visible:outline-none",
                    day_selected: "bg-primary text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_hidden: "invisible",
                  }}
                />
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold">{format(selectedDate, 'PPPP')}</h3>
                {selectedDate.toDateString() === new Date().toDateString() && (
                  <Badge variant="secondary">Today</Badge>
                )}
              </div>
              {dailyProgress ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-full p-1.5 sm:p-2 bg-blue-500/10">
                        <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Pomodoros</p>
                        <p className="text-lg sm:text-2xl font-bold">{dailyProgress.pomodorosCompleted}</p>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-full p-1.5 sm:p-2 bg-green-500/10">
                        <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Tasks</p>
                        <p className="text-lg sm:text-2xl font-bold">{dailyProgress.tasksCompleted}</p>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-full p-1.5 sm:p-2 bg-purple-500/10">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Habits</p>
                        <p className="text-lg sm:text-2xl font-bold">{dailyProgress.habitsCompleted}</p>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-full p-1.5 sm:p-2 bg-orange-500/10">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Focus Time</p>
                        <p className="text-lg sm:text-2xl font-bold">{dailyProgress.totalWorkMinutes}m</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="text-center py-4 sm:py-6">
                  <p className="text-sm text-muted-foreground">No activity recorded for this day</p>
                </div>
              )}
              <div className="pt-3 sm:pt-4 border-t">
                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500" />
                    </div>
                    <span>Activity indicators</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3" 
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Tasks and Habits Card */}
        <Card className="col-span-1 lg:col-span-3 border-2">
          <CardHeader className="space-y-3 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Tasks & Habits</CardTitle>
                <CardDescription className="text-sm sm:text-base">Manage your daily tasks and habits</CardDescription>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 sm:w-[250px] h-9 sm:h-11 text-sm"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 sm:h-11 sm:w-11">
                      <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setTaskFilter('all')}>
                      All Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTaskFilter('today')}>
                      Due Today
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTaskFilter('week')}>
                      Due This Week
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setTaskSort('priority')}>
                      Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTaskSort('dueDate')}>
                      Due Date
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="w-full sm:w-auto mb-4 sm:mb-6 h-9 sm:h-10">
                <TabsTrigger value="tasks" className="text-sm sm:text-base">Tasks</TabsTrigger>
                <TabsTrigger value="habits" className="text-sm sm:text-base">Habits</TabsTrigger>
              </TabsList>

              <TabsContent value="tasks">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg border-2 hover:bg-muted/50 transition-colors",
                          task.status === 'completed' && "opacity-60"
                        )}
                      >
                        <Switch
                          checked={task.status === 'completed'}
                          onCheckedChange={() => task.id && handleTaskComplete(task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            "font-medium text-base",
                            task.status === 'completed' && "line-through"
                          )}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 break-words">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            {task.dueDate && (
                              <p className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                {format(new Date(task.dueDate), "PPP")}
                              </p>
                            )}
                            {task.completedAt && (
                              <p className="flex items-center gap-2">
                                <Timer className="h-4 w-4" />
                                {format(new Date(task.completedAt), "PPP")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant={task.priority === 'high' ? 'destructive' : 'outline'}
                            className="capitalize"
                          >
                            {task.priority}
                          </Badge>
                          {task.pomodoroEstimate && (
                            <Badge variant="secondary" className="whitespace-nowrap">
                              {task.pomodoroEstimate} pomodoros
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredTasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No tasks found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="habits">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {habits.map((habit) => (
                      <div 
                        key={habit.id} 
                        className="flex items-center gap-4 p-4 rounded-lg border-2 hover:bg-muted/50 transition-colors"
                      >
                        <Switch
                          checked={isHabitCompletedOnDate(habit, selectedDate)}
                          onCheckedChange={() => habit.id && handleHabitComplete(habit.id)}
                          disabled={selectedDate.toDateString() !== new Date().toDateString()}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-base">{habit.habitName}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-sm text-muted-foreground">
                              Current Streak: <span className="font-semibold text-foreground">{habit.currentStreak}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Best Streak: <span className="font-semibold text-foreground">{habit.longestStreak}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="capitalize">
                            {habit.frequency}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => habit.id && handleDeleteHabit(habit.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {habits.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No habits found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="font-medium mb-2">Keyboard shortcuts:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-background rounded border">Space</kbd>
            <span className="text-sm text-muted-foreground">Start Pomodoro</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-background rounded border">P</kbd>
            <span className="text-sm text-muted-foreground">Stop current Pomodoro</span>
          </div>
        </div>
      </div>

      <TimerSettingsModal
        open={isTimerModalOpen}
        onOpenChange={setIsTimerModalOpen}
        workDuration={customWorkDuration}
        shortBreak={customShortBreak}
        longBreak={customLongBreak}
        onWorkDurationChange={setCustomWorkDuration}
        onShortBreakChange={setCustomShortBreak}
        onLongBreakChange={setCustomLongBreak}
      />
    </motion.div>
  );
} 