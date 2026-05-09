"use client";

import { useEffect, useState, useMemo } from "react";
import { Container, Typography, Box, CircularProgress, Slider, Fade } from "@mui/material";
import { APINotification, getTopPriorityNotifications } from "@/utils/priority";
import { fetchNotifications, logFrontendAction } from "../actions";
import NotificationCard from "@/components/NotificationCard";

export default function SmartInbox() {
  const [inboxItems, setInboxItems] = useState<APINotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [cutoffLimit, setCutoffLimit] = useState<number>(5);
  const [viewedRecords, setViewedRecords] = useState<Set<string>>(new Set());

  // Init local cache
  useEffect(() => {
    const cached = localStorage.getItem("user_viewed_notifs");
    if (cached) {
      try {
        setViewedRecords(new Set(JSON.parse(cached)));
      } catch (err) {}
    }

    const bootstrapData = async () => {
      setIsLoading(true);
      try {
        await logFrontendAction("info", "page", `User analyzing priority inbox`);
        
        // Grab a chunk of recent notifications to prioritize. 
        // Max limit is 10 per API constraints.
        const response = await fetchNotifications(1, 10); 
        if (response.error) {
          setApiError(typeof response.error === 'object' ? JSON.stringify(response.error) : response.error);
        } else {
          setInboxItems(response.data || []);
        }
      } catch (e: any) {
        setApiError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapData();
  }, []);

  // Recalculate priority ranking whenever dependencies change
  const priorityQueue = useMemo(() => {
    // 1. Filter out what the user already saw
    const unseen = inboxItems.filter(item => !viewedRecords.has(item.ID));
    // 2. Run the algorithmic sort
    return getTopPriorityNotifications(unseen, cutoffLimit);
  }, [inboxItems, cutoffLimit, viewedRecords]);

  const handleAcknowledge = (id: string) => {
    const updated = new Set(viewedRecords);
    updated.add(id);
    setViewedRecords(updated);
    localStorage.setItem("user_viewed_notifs", JSON.stringify(Array.from(updated)));
    
    logFrontendAction("info", "component", `Dismissed priority item ${id}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: { xs: 4, md: 6 } }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: "-1px", mb: 2, fontSize: { xs: "2rem", sm: "3rem" } }}>
          Smart Inbox
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", maxWidth: 600, fontSize: { xs: "0.9rem", sm: "1rem" } }}>
          This inbox mathematically ranks your unread alerts. It looks at the event category 
          (Placements beat Results) and applies a time-decay factor so older alerts naturally fall down the list.
        </Typography>
      </Box>

      <Box sx={{ 
        p: { xs: 2, sm: 3 }, mb: { xs: 3, md: 5 }, 
        borderRadius: "12px", 
        background: "rgba(25, 25, 25, 0.5)", 
        border: "1px solid rgba(255,255,255,0.05)" 
      }}>
        <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "1px" }}>
          Display Threshold
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, mt: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#fff" }}>
            {cutoffLimit}
          </Typography>
          <Slider
            value={cutoffLimit}
            min={1}
            max={10}
            step={1}
            onChange={(_, val) => setCutoffLimit(val as number)}
            sx={{
              color: "#fff",
              "& .MuiSlider-thumb": {
                width: 24, height: 24,
                "&:hover, &.Mui-focusVisible": { boxShadow: "0 0 0 8px rgba(255, 255, 255, 0.1)" }
              },
              "& .MuiSlider-track": { border: "none" }
            }}
          />
        </Box>
      </Box>

      {apiError && (
        <Box sx={{ p: 2, mb: 3, borderRadius: 2, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5" }}>
          {apiError}
        </Box>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress sx={{ color: "#fff" }} />
        </Box>
      ) : (
        <Fade in={!isLoading} timeout={400}>
          <Box>
            {priorityQueue.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10, color: "rgba(255,255,255,0.3)" }}>
                You're all caught up! No urgent updates.
              </Box>
            ) : (
              priorityQueue.map(item => (
                <NotificationCard 
                  key={item.ID} 
                  notifData={item} 
                  hasBeenViewed={false} 
                  triggerMarkRead={handleAcknowledge}
                />
              ))
            )}
          </Box>
        </Fade>
      )}
    </Container>
  );
}
