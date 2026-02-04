export interface NotificationPayload {
  title: string;
  body: string;
  trackerId?: string;
}

let notificationIntervalId: NodeJS.Timeout | null = null;
let weekendCleanupIntervalId: NodeJS.Timeout | null = null;
let isCheckingNotifications = false;

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const REMINDER_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes between reminders per tracker
const WEEKEND_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

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
  // Use Electron's native notifications if available (works in background)
  if (isElectron() && typeof (window as any).electron?.showNotification === 'function') {
    (window as any).electron.showNotification(payload);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    // Fallback to web notifications
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

// Get tasks remaining for a specific tracker
async function getTasksRemaining(trackerId: string): Promise<number> {
  try {
    const { getTasksByTracker, getCompletionsByTrackerAndDate, getTodayDateString } = await import('./db');
    
    const today = getTodayDateString();
    const tasks = await getTasksByTracker(trackerId);
    const completions = await getCompletionsByTrackerAndDate(trackerId, today);

    // Filter tasks that should be shown today (created before or on today at end of day)
    const [year, month, day] = today.split('-').map(Number);
    const todayEndOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
    const tasksForToday = tasks.filter(task => task.createdAt <= todayEndOfDay);

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

// Check and send notification if needed for all trackers
async function checkAndNotifyAllTrackers(): Promise<void> {
  if (isCheckingNotifications) {
    return;
  }

  isCheckingNotifications = true;

  try {
    const { 
      getAllTrackers,
      getTodayDateString, 
      addNotificationLog,
      getNotificationLogByTrackerAndDate 
    } = await import('./db');
    
    const today = getTodayDateString();
    const trackers = await getAllTrackers();

    if (trackers.length === 0) {
      return;
    }

    const trackerStatuses = await Promise.all(
      trackers.map(async (tracker) => ({
        tracker,
        remaining: await getTasksRemaining(tracker.id),
      }))
    );

    const totalRemaining = trackerStatuses.reduce((sum, status) => sum + status.remaining, 0);
    const trackersWithTasks = trackerStatuses.filter((status) => status.remaining > 0);
    const activeTrackerCount = trackersWithTasks.length;
    const now = Date.now();
    const aggregatedTrackerId = 'all-trackers';

    if (totalRemaining === 0) {
      const existingLog = await getNotificationLogByTrackerAndDate(aggregatedTrackerId, today, 'completion');
      if (!existingLog) {
        sendNotification({
          title: 'All Tasks Completed',
          body: 'Great job! Every tracker is fully complete for today.',
          trackerId: aggregatedTrackerId,
        });

        await addNotificationLog({
          id: `${aggregatedTrackerId}-${today}-${now}`,
          trackerId: aggregatedTrackerId,
          type: 'completion',
          sentAt: now,
          date: today,
          tasksRemaining: 0,
        });
      }
      return;
    }

    const existingLog = await getNotificationLogByTrackerAndDate(aggregatedTrackerId, today, 'reminder');
    const shouldSendReminder = !existingLog || (now - existingLog.sentAt) >= REMINDER_COOLDOWN_MS;

    if (!shouldSendReminder) {
      return;
    }

    sendNotification({
      title: 'Task Reminder',
      body: `You have ${totalRemaining} total task${totalRemaining === 1 ? '' : 's'} left for the day.`,
      trackerId: aggregatedTrackerId,
    });

    await addNotificationLog({
      id: `${aggregatedTrackerId}-${today}-${now}`,
      trackerId: aggregatedTrackerId,
      type: 'reminder',
      sentAt: now,
      date: today,
      tasksRemaining: totalRemaining,
    });
  } catch (error) {
    console.error('Error checking and notifying all trackers:', error);
  } finally {
    isCheckingNotifications = false;
  }
}

// Check if it's the weekend (Saturday or Sunday)
function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

// Clear notification logs on weekend
async function checkAndClearLogs(): Promise<void> {
  try {
    if (isWeekend()) {
      const { clearOldNotificationLogs } = await import('./db');
      await clearOldNotificationLogs();
    }
  } catch (error) {
    console.error('Error clearing notification logs:', error);
  }
}

// Start notification scheduler (checks all trackers every minute)
export async function startNotificationScheduler(): Promise<void> {
  // Request permission first
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.warn('Notification permission not granted');
    return;
  }

  // Clear existing intervals if any
  if (notificationIntervalId) {
    clearInterval(notificationIntervalId);
  }
  if (weekendCleanupIntervalId) {
    clearInterval(weekendCleanupIntervalId);
  }

  // Send initial notification check
  await checkAndNotifyAllTrackers();

  // Set up notification interval (every 1 minute)
  notificationIntervalId = setInterval(() => {
    checkAndNotifyAllTrackers();
  }, CHECK_INTERVAL_MS);

  // Set up weekend cleanup check (every 6 hours)
  weekendCleanupIntervalId = setInterval(() => {
    checkAndClearLogs();
  }, WEEKEND_CLEANUP_INTERVAL_MS);

  // Also check immediately on start
  await checkAndClearLogs();
}

// Stop notification scheduler
export function stopNotificationScheduler(): void {
  if (notificationIntervalId) {
    clearInterval(notificationIntervalId);
    notificationIntervalId = null;
  }
  if (weekendCleanupIntervalId) {
    clearInterval(weekendCleanupIntervalId);
    weekendCleanupIntervalId = null;
  }
}

// Start or stop notifications based on enabled state
export function updateNotificationState(enabled: boolean): void {
  stopNotificationScheduler();
  if (enabled) {
    startNotificationScheduler();
  }
}
