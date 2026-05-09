export type NotifCategory = "Event" | "Result" | "Placement";

export interface SystemAlert {
  ID: string;
  Type: NotifCategory;
  Message: string;
  Timestamp: string;
}

// Hardcoded base weights for the algorithm
const BASE_SCORES: Record<NotifCategory, number> = {
  Placement: 300,
  Result: 200,
  Event: 100,
};

/**
 * Calculates a dynamic priority score for any given alert.
 * The math here is simple: Base Weight - (Hours Elapsed).
 * 
 * Why this works:
 * A 5-hour old "Placement" gets 295 points.
 * A brand new "Result" gets 200 points.
 * Placements still win, but eventually, if an alert is ignored for weeks, 
 * it will sink below newer, lower-tier alerts.
 */
export const calculateDynamicScore = (alert: SystemAlert): number => {
  const basePoints = BASE_SCORES[alert.Type] || 0;
  
  // Calculate the age of the alert in hours
  const currentTime = new Date();
  const alertTime = new Date(alert.Timestamp);
  
  const diffMilliseconds = currentTime.getTime() - alertTime.getTime();
  const diffHours = diffMilliseconds / (1000 * 60 * 60);

  // Final score
  return basePoints - diffHours;
};

/**
 * Grabs the top N items from a raw list.
 * Note: If we were doing this on a live stream of millions of events, 
 * I'd use a Min-Heap here to keep it O(1) space and O(log N) inserts.
 * But for standard API pagination sorting, a native array sort is totally fine.
 */
export const extractTopPriority = (
  alerts: SystemAlert[],
  limit: number = 10
): SystemAlert[] => {
  
  // Create a copy so we don't mutate the original array
  const sortedAlerts = [...alerts].sort((a, b) => {
    return calculateDynamicScore(b) - calculateDynamicScore(a); // Descending order
  });

  return sortedAlerts.slice(0, limit);
};
