"use client";

import { useEffect, useState, useMemo } from "react";
import * as Icons from "@tabler/icons-react";
import {
  initDB,
  getAllTrackers,
  getTasksByTracker,
  getCompletionsByTracker,
  addTracker,
  addTask,
  deleteTask,
  deleteTracker,
  updateTracker,
  setTaskCompletion,
} from "@/lib/db";

type Tracker = {
  id: string;
  name: string;
  icon?: {
    icon?: string;
    emoji?: string;
    color?: string;
  } | null;
  createdAt: number;
};
type Task = {
  id: string;
  trackerId: string;
  title: string;
  createdAt: number;
};
type TaskCompletion = {
  id: string;
  taskId: string;
  trackerId: string;
  date: string;
  completed: boolean;
  rating: number;
};
import {
  updateNotificationState,
  requestNotificationPermission,
  sendNotification,
} from "@/lib/notifications";
import { TasksView } from "@/components/tasks-view";
import { Analytics } from "@/components/analytics";
import { CreateTrackerDialog } from "@/components/create-tracker-dialog";
import { EditTrackerDialog } from "@/components/edit-tracker-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ThemeToggle } from "@/components/theme-provider";
import { Spinner } from "@/components/ui/spinner";
import { createIconName } from "@/components/icon-picker/picker";
import { Switch } from "@/components/ui/switch";

export default function Home() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [activeTab, setActiveTab] = useState<"tasks" | "analysis">("tasks");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Initialize DB and load data
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        await loadTrackers();
        
        // Load notification preference from localStorage
        const savedPref = localStorage.getItem('notificationsEnabled');
        const enabled = savedPref !== null ? savedPref === 'true' : true;
        setNotificationsEnabled(enabled);
        
        // Request permission on first use
        await requestNotificationPermission();
        
        // Start notification system if enabled
        if (enabled) {
          updateNotificationState(true);
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  // Load trackers
  const loadTrackers = async () => {
    try {
      const allTrackers = await getAllTrackers();
      setTrackers(allTrackers);
      if (allTrackers.length > 0 && !selectedTracker) {
        setSelectedTracker(allTrackers[0]);
      }
    } catch (error) {
      console.error("Failed to load trackers:", error);
    }
  };

  // Load tasks and completions for selected tracker
  useEffect(() => {
    if (!selectedTracker) return;

    const loadData = async () => {
      try {
        const trackerTasks = await getTasksByTracker(selectedTracker.id);
        setTasks(trackerTasks);

        const allCompletions = await getCompletionsByTracker(
          selectedTracker.id,
        );
        setCompletions(allCompletions);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, [selectedTracker]);

  // Calendar completion data
  const calendarCompletionData = useMemo(() => {
    const dataMap = new Map<string, { completed: number; total: number }>();

    // Group completions by date
    const dateGroups = new Map<string, TaskCompletion[]>();
    completions.forEach((completion) => {
      if (!dateGroups.has(completion.date)) {
        dateGroups.set(completion.date, []);
      }
      dateGroups.get(completion.date)!.push(completion);
    });

    // Calculate completion stats for each date
    dateGroups.forEach((dateCompletions, date) => {
      // Parse the date string and set to end of day to include tasks created on that day
      const dateParts = date.split("-");
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2]);
      const dateEndOfDay = new Date(
        year,
        month,
        day,
        23,
        59,
        59,
        999,
      ).getTime();

      const tasksForDate = tasks.filter(
        (task) => task.createdAt <= dateEndOfDay,
      );
      const completed = dateCompletions.filter((c) => c.completed).length;

      dataMap.set(date, {
        completed,
        total: tasksForDate.length,
      });
    });

    return dataMap;
  }, [tasks, completions]);

  // Handle create tracker
  const handleCreateTracker = async (
    name: string,
    taskTitles: string[],
    icon: { icon?: string; emoji?: string; color?: string } | null,
  ) => {
    try {
      const tracker: Tracker = {
        id: `tracker-${Date.now()}`,
        name,
        icon: icon ?? null,
        createdAt: Date.now(),
      };

      await addTracker(tracker);

      if (notificationsEnabled) {
        sendNotification({
          title: "Tracker Created",
          body: `New tracker "${name}" has been created with ${taskTitles.length} tasks.`,
          trackerId: tracker.id,
        });
      }

      const now = Date.now();
      for (const title of taskTitles) {
        const task: Task = {
          id: `task-${Date.now()}-${Math.random()}`,
          trackerId: tracker.id,
          title,
          createdAt: now,
        };
        await addTask(task);
      }

      await loadTrackers();
      setSelectedTracker(tracker);
    } catch (error) {
      console.error("Failed to create tracker:", error);
    }
  };

  // Handle add task to existing tracker
  const handleAddTask = async (title: string) => {
    if (!selectedTracker) return;

    try {
      const task: Task = {
        id: `task-${Date.now()}-${Math.random()}`,
        trackerId: selectedTracker.id,
        title,
        createdAt: Date.now(),
      };
      await addTask(task);

      const updatedTasks = await getTasksByTracker(selectedTracker.id);
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      if (selectedTracker) {
        const updatedTasks = await getTasksByTracker(selectedTracker.id);
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Handle delete tracker
  const handleDeleteTracker = async (trackerId: string) => {
    try {
      const trackerToDelete = trackers.find((t) => t.id === trackerId);
      if (trackerToDelete && notificationsEnabled) {
        sendNotification({
          title: "Tracker Deleted",
          body: `Tracker "${trackerToDelete.name}" has been deleted.`,
        });
      }

      await deleteTracker(trackerId);
      await loadTrackers();

      const remainingTrackers = await getAllTrackers();
      if (remainingTrackers.length > 0) {
        setSelectedTracker(remainingTrackers[0]);
      } else {
        setSelectedTracker(null);
      }
    } catch (error) {
      console.error("Failed to delete tracker:", error);
    }
  };

  // Handle update tracker
  const handleUpdateTracker = async (updates: { name?: string; icon?: { icon?: string; emoji?: string; color?: string } | null }) => {
    if (!selectedTracker) return;

    try {
      const updatedTracker: Tracker = {
        ...selectedTracker,
        ...(updates.name && { name: updates.name }),
        ...(updates.icon !== undefined && { icon: updates.icon }),
      };

      await updateTracker(updatedTracker);
      await loadTrackers();
      setSelectedTracker(updatedTracker);

      if (notificationsEnabled) {
        sendNotification({
          title: "Tracker Updated",
          body: `Tracker "${updatedTracker.name}" has been updated.`,
          trackerId: updatedTracker.id,
        });
      }
    } catch (error) {
      console.error("Failed to update tracker:", error);
    }
  };

  // Handle toggle task completion
  const handleToggleComplete = async (task: Task, date: string) => {
    if (!selectedTracker) return;

    try {
      const dateCompletions = completions.filter((c) => c.date === date);
      const existingCompletion = dateCompletions.find(
        (c) => c.taskId === task.id,
      );
      const newCompleted = existingCompletion
        ? !existingCompletion.completed
        : true;

      const completion: TaskCompletion = {
        id:
          existingCompletion?.id || `completion-${Date.now()}-${Math.random()}`,
        taskId: task.id,
        trackerId: selectedTracker.id,
        date: date,
        completed: newCompleted,
        rating: newCompleted ? existingCompletion?.rating || 0 : 0,
      };

      await setTaskCompletion(completion);

      const updatedCompletions = await getCompletionsByTracker(
        selectedTracker.id,
      );
      setCompletions(updatedCompletions);
    } catch (error) {
      console.error("Failed to toggle completion:", error);
    }
  };

  // Handle rating change
  const handleRatingChange = async (
    task: Task,
    date: string,
    rating: number,
  ) => {
    if (!selectedTracker) return;

    try {
      const dateCompletions = completions.filter((c) => c.date === date);
      const existingCompletion = dateCompletions.find(
        (c) => c.taskId === task.id,
      );

      const completion: TaskCompletion = {
        id:
          existingCompletion?.id || `completion-${Date.now()}-${Math.random()}`,
        taskId: task.id,
        trackerId: selectedTracker.id,
        date: date,
        completed: existingCompletion?.completed || false,
        rating,
      };

      await setTaskCompletion(completion);

      const updatedCompletions = await getCompletionsByTracker(
        selectedTracker.id,
      );
      setCompletions(updatedCompletions);
    } catch (error) {
      console.error("Failed to update rating:", error);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = async (checked: boolean) => {
    if (!checked) {
      // Send notification BEFORE disabling
      sendNotification({
        title: "Notifications Off",
        body: "You will no longer receive task reminders.",
      });
    }
    
    setNotificationsEnabled(checked);
    localStorage.setItem('notificationsEnabled', String(checked));
    
    // Update notification system state
    updateNotificationState(checked);
    
    if (checked) {
      // Request permission if not already granted
      await requestNotificationPermission();
      // Send notification AFTER enabling
      sendNotification({
        title: "Notifications On",
        body: "You will now receive task reminders for all trackers.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-dvh">
        <Spinner className="size-5" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      {/* Sidebar */}
      <Sidebar variant="inset">
        <SidebarContent className="gap-0">
          <div
            className="w-full min-h-6 flex items-center justify-start px-2"
            style={{ WebkitAppRegion: "drag" } as any}
          >
            <div />
            {typeof window !== "undefined" &&
              (window as any).electron &&
              (window as any).electron.platform === "win32" && (
                <div
                  className="flex gap-1 pt-2"
                  style={{ WebkitAppRegion: "no-drag" } as any}
                >
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => {
                      (window as any).electron.notifyBeforeClose(notificationsEnabled);
                      setTimeout(() => (window as any).electron.close(), 100);
                    }}
                    title="Close"
                  >
                    <Icons.IconX />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => (window as any).electron.maximize()}
                    title="Maximize/Restore"
                  >
                    <Icons.IconSquare />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => (window as any).electron.minimize()}
                    title="Minimize"
                  >
                    <Icons.IconMinus />
                  </Button>
                </div>
              )}
          </div>
          <SidebarGroup className="p-1">
            <div className="flex items-center justify-between px-1 pb-4 pt-2">
              <h1 className="text-xl font-semibold">Task Tracker</h1>
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
                size="icon-sm"
              >
                <Icons.IconPlus />
              </Button>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {trackers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10 px-2">
                    No trackers yet
                  </p>
                ) : (
                  trackers.map((tracker) => (
                    <SidebarMenuItem key={tracker.id}>
                      <SidebarMenuButton
                        onClick={() => setSelectedTracker(tracker)}
                        isActive={selectedTracker?.id === tracker.id}
                      >
                        {tracker.icon?.emoji ? (
                          <span className="text-xl leading-none">{tracker.icon.emoji}</span>
                        ) : tracker.icon?.icon ? (
                          (() => {
                            const IconComp = (Icons as any)[
                              createIconName(tracker.icon.icon)
                            ];
                            return (
                              <IconComp className="size-5" style={{ color: tracker.icon.color }} />
                            );
                          })()
                        ) : null}
                        {tracker.name}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton className="cursor-pointer" onClick={() => handleNotificationToggle(!notificationsEnabled)}>Send Notifications</SidebarMenuButton>
                <SidebarMenuBadge className="w-fit right-2">
                  <Switch 
                    className="[--thumb-size:14px]!" 
                    checked={notificationsEnabled}
                  />
                </SidebarMenuBadge>
            </SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <SidebarInset>
        {!selectedTracker ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icons.IconCheck />
              </EmptyMedia>
              <EmptyTitle>No Tracker Selected</EmptyTitle>
              <EmptyDescription>
                Create a tracker to get started.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="default"
                size="default"
              >
                <Icons.IconPlus />
                Create Tracker
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Header */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-1 flex-col gap-0 overflow-hidden"
            >
              <div className="w-full flex items-center justify-between gap-2 border-b border-dashed p-2">
                <TabsList variant="default">
                  <TabsTab value="tasks">Tasks</TabsTab>
                  <TabsTab value="analysis">Analysis</TabsTab>
                </TabsList>
                <Button
                  onClick={() => setShowEditDialog(true)}
                  variant="default"
                  size="default"
                >
                  <Icons.IconPencil />
                  Edit
                </Button>
              </div>

              {/* Content */}

              <div className="size-full max-h-[calc(100vh-53px-18px)] overflow-y-auto">
                <TabsPanel
                  value="tasks"
                  className="flex flex-1 flex-col gap-6 p-4"
                >
                  <TasksView
                    tasks={tasks}
                    completions={completions}
                    calendarCompletionData={calendarCompletionData}
                    onToggleComplete={handleToggleComplete}
                    onRatingChange={handleRatingChange}
                    trackerCreatedAt={selectedTracker.createdAt}
                  />
                </TabsPanel>
                <TabsPanel
                  value="analysis"
                  className="flex flex-1 flex-col gap-6 p-4"
                >
                  <Analytics
                    tasks={tasks}
                    completions={completions}
                    trackerCreatedAt={selectedTracker.createdAt}
                  />
                </TabsPanel>
              </div>
            </Tabs>
          </div>
        )}
      </SidebarInset>

      {/* Dialogs */}
      <CreateTrackerDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateTracker}
      />

      {selectedTracker && (
        <EditTrackerDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          tracker={selectedTracker}
          existingTasks={tasks}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onDeleteTracker={handleDeleteTracker}
          onUpdateTracker={handleUpdateTracker}
        />
      )}
    </SidebarProvider>
  );
}
