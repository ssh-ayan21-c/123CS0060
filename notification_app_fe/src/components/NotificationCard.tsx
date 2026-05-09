"use client";

import { Box, Typography, Button } from "@mui/material";
import { APINotification } from "@/utils/priority";

interface Props {
  notifData: APINotification;
  hasBeenViewed: boolean;
  triggerMarkRead: (id: string) => void;
}

export default function NotificationCard({ notifData, hasBeenViewed, triggerMarkRead }: Props) {
  const getBadgeStyle = (category: string) => {
    switch (category) {
      case "Placement": return { bg: "rgba(255, 255, 255, 0.1)", color: "#fff", border: "rgba(255, 255, 255, 0.2)" };
      case "Result": return { bg: "rgba(255, 255, 255, 0.05)", color: "#d4d4d4", border: "rgba(255, 255, 255, 0.1)" };
      case "Event": return { bg: "transparent", color: "#a3a3a3", border: "rgba(255, 255, 255, 0.1)" };
      default: return { bg: "transparent", color: "#737373", border: "rgba(255, 255, 255, 0.05)" };
    }
  };

  const badge = getBadgeStyle(notifData.Type);

  return (
    <Box 
      sx={{ 
        mb: { xs: 2, sm: 2.5 }, 
        p: { xs: 2, sm: 3 },
        borderRadius: "12px",
        background: hasBeenViewed ? "transparent" : "rgba(25, 25, 25, 0.6)",
        border: "1px solid",
        borderColor: hasBeenViewed ? "rgba(255,255,255,0.05)" : "rgba(255, 255, 255, 0.15)",
        boxShadow: hasBeenViewed ? "none" : "0 4px 20px rgba(0,0,0,0.5)",
        transition: "all 0.2s ease-in-out",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: hasBeenViewed ? "none" : "0 8px 24px rgba(0,0,0,0.6)",
          borderColor: hasBeenViewed ? "rgba(255,255,255,0.1)" : "rgba(255, 255, 255, 0.25)",
        }
      }}
    >
      {/* Decorative gradient for unread items */}
      {!hasBeenViewed && (
        <Box sx={{
          position: "absolute",
          top: 0, left: 0, width: "3px", height: "100%",
          background: "#ffffff"
        }} />
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1, sm: 0 }, mb: 2 }}>
        <Box 
          sx={{ 
            px: 1.5, py: 0.5, 
            borderRadius: "6px", 
            background: badge.bg, 
            border: `1px solid ${badge.border}`,
            color: badge.color,
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.5px",
            textTransform: "uppercase"
          }}
        >
          {notifData.Type}
        </Box>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 500, fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
          {new Date(notifData.Timestamp).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
          })}
        </Typography>
      </Box>

      <Typography variant="body1" sx={{ color: hasBeenViewed ? "rgba(255,255,255,0.7)" : "#f8fafc", lineHeight: 1.6, fontWeight: hasBeenViewed ? 400 : 500, fontSize: { xs: "0.9rem", sm: "1rem" } }}>
        {notifData.Message}
      </Typography>
      
      {!hasBeenViewed && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: { xs: 2, sm: 3 } }}>
          <Button 
            size="small" 
            disableElevation
            onClick={() => triggerMarkRead(notifData.ID)}
            sx={{
              color: "#fff",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "0.8rem",
              "&:hover": { background: "rgba(255,255,255,0.1)" }
            }}
          >
            Mark as read
          </Button>
        </Box>
      )}
    </Box>
  );
}
