export type NotifCategory = "Event" | "Result" | "Placement";

export interface APINotification {
  ID: string;
  Type: NotifCategory;
  Message: string;
  Timestamp: string;
}

const BASE_SCORES: Record<NotifCategory, number> = {
  Placement: 300,
  Result: 200,
  Event: 100,
};

export const calculateDynamicScore = (alert: APINotification): number => {
  const basePoints = BASE_SCORES[alert.Type] || 0;
  
  const currentTime = new Date();
  const alertTime = new Date(alert.Timestamp);
  
  const diffMilliseconds = currentTime.getTime() - alertTime.getTime();
  const diffHours = diffMilliseconds / (1000 * 60 * 60);

  return basePoints - diffHours;
};

export const getTopPriorityNotifications = (
  alerts: APINotification[],
  limit: number = 10
): APINotification[] => {
  
  const sortedAlerts = [...alerts].sort((a, b) => {
    return calculateDynamicScore(b) - calculateDynamicScore(a);
  });

  return sortedAlerts.slice(0, limit);
};
