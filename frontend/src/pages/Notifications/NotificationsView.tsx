import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Sparkles, Trophy } from 'lucide-react';
import { notificationsApi } from '../../api/notifications';
import { NotificationItem } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationsApi.getNotifications();
      setNotifications(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update notifications.');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update this notification.');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading notification feed..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchNotifications} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <Badge variant="indigo" icon={<Bell className="w-3.5 h-3.5" />}>
            In-App Notifications
          </Badge>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">Alerts & Reminders</h2>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          leftIcon={<CheckCheck className="w-4 h-4" />}
        >
          Mark All as Read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No Notifications" description="You're all caught up with your microlearning reminders." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 transition-all ${
                !n.is_read ? 'bg-indigo-950/20 border-indigo-500/40' : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 text-indigo-400 mt-0.5">
                    {n.type === 'achievement' ? (
                      <Trophy className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">{n.title}</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Mark as read"
                    onClick={() => void handleMarkRead(n.id)}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
