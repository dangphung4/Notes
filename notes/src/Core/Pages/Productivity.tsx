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
import { Timer, BarChart2, Calendar as CalendarIcon, Filter, Bell, BellOff, Settings } from 'lucide-react';
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
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Timer Settings</DialogTitle>
        <DialogDescription>
          Customize your Pomodoro timer durations
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="workDuration">Work Duration (minutes)</Label>
          <Input
            id="workDuration"
            type="number"
            value={workDuration}
            onChange={(e) => onWorkDurationChange(Number(e.target.value))}
            min={1}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="shortBreak">Short Break (minutes)</Label>
          <Input
            id="shortBreak"
            type="number"
            value={shortBreak}
            onChange={(e) => onShortBreakChange(Number(e.target.value))}
            min={1}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="longBreak">Long Break (minutes)</Label>
          <Input
            id="longBreak"
            type="number"
            value={longBreak}
            onChange={(e) => onLongBreakChange(Number(e.target.value))}
            min={1}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onOpenChange(false)}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
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

  const isHabitCompletedToday = (habit: HabitTracker): boolean => {
    const today = new Date().toDateString();
    return habit.completedDates.some(date => 
      new Date(date).toDateString() === today
    );
  };

  const filteredTasks = tasks.filter(task => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
      if (!matches) return false;
    }

    if (taskFilter === 'today') {
      const isToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();
      return isToday || (task.completedAt && new Date(task.completedAt).toDateString() === new Date().toDateString());
    }
    if (taskFilter === 'week') {
      const today = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);
      const isDueThisWeek = task.dueDate && new Date(task.dueDate) <= weekFromNow;
      return isDueThisWeek || (task.completedAt && new Date(task.completedAt) >= today && new Date(task.completedAt) <= weekFromNow);
    }
    return true;
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

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">Productivity Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Disable sound" : "Enable sound"}
            >
              {soundEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <NewTaskDialog onTaskCreated={loadData} />
            <NewHabitDialog onHabitCreated={loadData} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Pomodoro Timer Card */}
        <Card className="col-span-1">
          <CardHeader className="space-y-2">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Pomodoro Timer
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTimerModalOpen(true)}
                title="Timer Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Focus on your work in timed sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-6">
              <div className="w-40 h-40 md:w-48 md:h-48">
                <CircularProgressbar
                  value={activePomodoro ? (timeLeft / (activePomodoro.duration * 60)) * 100 : 0}
                  text={activePomodoro ? formatTime(timeLeft) : '00:00'}
                  styles={buildStyles({
                    pathColor: pomodoroType === 'work' ? '#ef4444' : '#22c55e',
                    textColor: 'currentColor',
                    trailColor: 'rgba(0,0,0,0.1)',
                    textSize: '16px',
                    pathTransitionDuration: 0.3,
                    strokeLinecap: 'round',
                  })}
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {!activePomodoro ? (
                  <>
                    <Button 
                      onClick={() => startPomodoro('work')} 
                      variant="default"
                      className="min-w-[120px]"
                    >
                      Work ({customWorkDuration}m)
                    </Button>
                    <Button 
                      onClick={() => startPomodoro('short-break')} 
                      variant="outline"
                      className="min-w-[120px]"
                    >
                      Short ({customShortBreak}m)
                    </Button>
                    <Button 
                      onClick={() => startPomodoro('long-break')} 
                      variant="outline"
                      className="min-w-[120px]"
                    >
                      Long ({customLongBreak}m)
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={completePomodoro} 
                    variant="destructive"
                    className="min-w-[120px]"
                  >
                    Stop Timer
                  </Button>
                )}
              </div>
              <div className="text-sm text-muted-foreground text-center">
                <p className="mt-1">Press Space to start/stop timer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Progress Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Today's Progress
            </CardTitle>
            <CardDescription>Track your daily achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Pomodoros</span>
                  <span>{dailyProgress?.pomodorosCompleted || 0}/8</span>
                </div>
                <Progress value={calculateProgress()} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Tasks Completed</span>
                  <span>{dailyProgress?.tasksCompleted || 0}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Habits Completed</span>
                  <span>{dailyProgress?.habitsCompleted || 0}/{habits.length}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Total Focus Time</span>
                  <span>{dailyProgress?.totalWorkMinutes || 0} minutes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Progress Calendar
            </CardTitle>
            <CardDescription>View your productivity history</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              disabled={{ after: new Date() }}
              initialFocus
            />
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Selected Date: {format(selectedDate, 'PPP')}</p>
              {dailyProgress && (
                <>
                  <div className="text-sm">
                    <span className="font-medium">Pomodoros:</span> {dailyProgress.pomodorosCompleted}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Tasks:</span> {dailyProgress.tasksCompleted}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Habits:</span> {dailyProgress.habitsCompleted}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Focus Time:</span> {dailyProgress.totalWorkMinutes} minutes
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Tasks and Habits Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Tasks & Habits</CardTitle>
                <CardDescription>Manage your daily tasks and habits</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px]"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
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
            <Tabs defaultValue="tasks">
              <TabsList>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="habits">Habits</TabsTrigger>
              </TabsList>

              <TabsContent value="tasks">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={cn(
                          "flex items-center gap-4 p-2 rounded-lg hover:bg-muted",
                          task.status === 'completed' && "opacity-60"
                        )}
                      >
                        <Switch
                          checked={task.status === 'completed'}
                          onCheckedChange={() => task.id && handleTaskComplete(task.id)}
                        />
                        <div className="flex-1">
                          <h4 className={cn(
                            "font-medium",
                            task.status === 'completed' && "line-through"
                          )}>
                            {task.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          {task.dueDate && (
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(task.dueDate), "PPP")}
                            </p>
                          )}
                          {task.completedAt && (
                            <p className="text-sm text-muted-foreground">
                              Completed: {format(new Date(task.completedAt), "PPP")}
                            </p>
                          )}
                          {task.pomodoroEstimate && (
                            <p className="text-sm text-muted-foreground">
                              Estimated: {task.pomodoroEstimate} pomodoros
                            </p>
                          )}
                        </div>
                        <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="habits">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {habits.map((habit) => (
                      <div key={habit.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                        <Switch
                          checked={isHabitCompletedToday(habit)}
                          onCheckedChange={() => habit.id && handleHabitComplete(habit.id)}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{habit.habitName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Streak: {habit.currentStreak} days | Best: {habit.longestStreak} days
                          </p>
                        </div>
                        <Badge>
                          {habit.frequency}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Keyboard shortcuts:</p>
        <ul className="list-disc list-inside">
          <li>Space - Start Pomodoro</li>
          <li>P - Stop current Pomodoro</li>
        </ul>
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
    </div>
  );
} 