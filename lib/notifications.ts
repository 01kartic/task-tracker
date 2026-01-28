export interface NotificationPayload {
  title: string;
  body: string;
  trackerId?: string;
}

let notificationIntervalId: NodeJS.Timeout | null = null;
let lastNotificationDate: string | null = null;
let hasCompletedToday = false;

// Check if code is running in Electron
export function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).process !== 'undefined';
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
}

// Send notification
export function sendNotification(payload: NotificationPayload): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(payload.title, {
      body: payload.body,
      requireInteraction: false,
    });

    if (payload.trackerId) {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
}

// Get tasks remaining for current tracker
async function getTasksRemaining(trackerId: string): Promise<number> {
  try {
    const { getTasksByTracker, getCompletionsByTrackerAndDate, getTodayDateString } = await import('./db');
    
    const today = getTodayDateString();
    const tasks = await getTasksByTracker(trackerId);
    const completions = await getCompletionsByTrackerAndDate(trackerId, today);

    // Filter tasks that should be shown today (created before or on today)
    const todayTimestamp = new Date(today).getTime();
    const tasksForToday = tasks.filter(task => task.createdAt <= todayTimestamp);

    // Count incomplete tasks
    const incompleteTasks = tasksForToday.filter(task => {
      const completion = completions.find(c => c.taskId === task.id);
      return !completion || !completion.completed;
    });

    return incompleteTasks.length;
  } catch (error) {
    console.error('Error getting tasks remaining:', error);
    return 0;
  }
}

// Check and send notification if needed
async function checkAndNotify(trackerId: string | null): Promise<void> {
  if (!trackerId) {
    return;
  }

  const remaining = await getTasksRemaining(trackerId);

  if (remaining === 0) {
    // All tasks completed
    if (!hasCompletedToday) {
      sendNotification({
        title: 'All Tasks Completed !',
        body: 'Well done ! You\'ve completed all tasks for today.',
        trackerId,
      });
      hasCompletedToday = true;
    }
  } else {
    // Tasks remaining
    sendNotification({
      title: 'Tasks Reminder',
      body: `You have ${remaining} task${remaining > 1 ? 's' : ''} remaining today.`,
      trackerId,
    });
  }
}

// Start notification scheduler (every 2 hours)
export async function startNotificationScheduler(trackerId: string | null): Promise<void> {
  // Request permission first
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('Notification permission denied');
    return;
  }

  // Clear existing interval if any
  if (notificationIntervalId) {
    clearInterval(notificationIntervalId);
  }

  // Send initial notification if within time range
  await checkAndNotify(trackerId);

  // Set up interval (every 1 hour = 3600000 ms)
  notificationIntervalId = setInterval(() => {
    checkAndNotify(trackerId);
  }, 60 * 60 * 1000); // 1 hour
}

// Stop notification scheduler
export function stopNotificationScheduler(): void {
  if (notificationIntervalId) {
    clearInterval(notificationIntervalId);
    notificationIntervalId = null;
  }
}

// Update tracker for notifications
export function updateNotificationTracker(trackerId: string | null): void {
  stopNotificationScheduler();
  if (trackerId) {
    startNotificationScheduler(trackerId);
  }
}

// Force reset completion flag (useful for testing or manual reset)
export function resetCompletionFlag(): void {
  hasCompletedToday = false;
}
