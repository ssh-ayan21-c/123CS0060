"use client";

import { useEffect, useState } from "react";
import { Container, Typography, Box, CircularProgress, Select, MenuItem, Pagination, Fade } from "@mui/material";
import { APINotification } from "@/utils/priority";
import { fetchNotifications, logFrontendAction } from "./actions";
import NotificationCard from "@/components/NotificationCard";

export default function Feed() {
  const [notifList, setNotifList] = useState<APINotification[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchIssue, setFetchIssue] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [viewedSet, setViewedSet] = useState<Set<string>>(new Set());

  // Mount effect to grab local storage
  useEffect(() => {
    const cachedReads = localStorage.getItem("user_viewed_notifs");
    if (cachedReads) {
      try {
        setViewedSet(new Set(JSON.parse(cachedReads)));
      } catch (e) {
        console.warn("Failed to parse cached reads", e);
      }
    }
  }, []);

  // Fetch effect
  useEffect(() => {
    const pullData = async () => {
      setIsFetching(true);
      setFetchIssue(null);
      try {
        await logFrontendAction("info", "page", `User fetching feed page ${currentPage} with filter ${activeFilter}`);
        const response = await fetchNotifications(currentPage, 10, activeFilter !== "All" ? activeFilter : undefined);
        
        if (response.error) {
          setFetchIssue(typeof response.error === 'object' ? JSON.stringify(response.error) : response.error);
          await logFrontendAction("error", "page", `Feed fetch failed: ${JSON.stringify(response.error)}`);
        } else {
          setNotifList(response.data || []);
        }
      } catch (err: any) {
        setFetchIssue(err.message);
      } finally {
        setIsFetching(false);
      }
    };

    pullData();
  }, [currentPage, activeFilter]);

  const handleReadClick = async (notifId: string) => {
    // Optimistic update
    const newSet = new Set(viewedSet);
    newSet.add(notifId);
    setViewedSet(newSet);
    localStorage.setItem("user_viewed_notifs", JSON.stringify(Array.from(newSet)));
    
    // Fire and forget log
    logFrontendAction("info", "component", `User acknowledged notif: ${notifId}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: { xs: 3, md: 5 }, display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "flex-end" }, gap: { xs: 2, sm: 0 } }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: "-1px", mb: 1, fontSize: { xs: "2rem", sm: "3rem" } }}>
            Live Feed
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)", fontSize: { xs: "0.9rem", sm: "1rem" } }}>
            Stay updated with everything happening on campus.
          </Typography>
        </Box>

        <Select
          size="small"
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setCurrentPage(1);
          }}
          sx={{
            width: { xs: "100%", sm: "auto" },
            color: "#fff",
            background: "rgba(25, 25, 25, 0.5)",
            borderRadius: "6px",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
            "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.5)" }
          }}
        >
          <MenuItem value="All">All Categories</MenuItem>
          <MenuItem value="Placement">Placements</MenuItem>
          <MenuItem value="Result">Results</MenuItem>
          <MenuItem value="Event">Events</MenuItem>
        </Select>
      </Box>

      {fetchIssue && (
        <Box sx={{ p: 2, mb: 3, borderRadius: 2, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5" }}>
          {fetchIssue}
        </Box>
      )}

      {isFetching ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress sx={{ color: "#fff" }} />
        </Box>
      ) : (
        <Fade in={!isFetching} timeout={400}>
          <Box>
            {notifList.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10, color: "rgba(255,255,255,0.3)" }}>
                No updates right now. Check back later!
              </Box>
            ) : (
              notifList.map(item => (
                <NotificationCard 
                  key={item.ID} 
                  notifData={item} 
                  hasBeenViewed={viewedSet.has(item.ID)}
                  triggerMarkRead={handleReadClick}
                />
              ))
            )}
          </Box>
        </Fade>
      )}

      {!isFetching && notifList.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: { xs: 4, md: 6 } }}>
          <Pagination 
            count={10} // Just a mock bound since we don't have total from API directly
            page={currentPage} 
            size="small"
            siblingCount={0}
            onChange={(_, val) => setCurrentPage(val)} 
            sx={{
              "& .MuiPaginationItem-root": { color: "rgba(255,255,255,0.7)" },
              "& .Mui-selected": { background: "rgba(255, 255, 255, 0.1) !important", color: "#fff" }
            }}
          />
        </Box>
      )}
    </Container>
  );
}
