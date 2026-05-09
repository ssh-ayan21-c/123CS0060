"use client";

import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const currentRoute = usePathname();

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        background: "rgba(10, 10, 10, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto", px: { xs: 1, sm: 2 } }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            fontWeight: 700, 
            letterSpacing: "-0.5px",
            color: "#ffffff",
            fontSize: { xs: "1.1rem", sm: "1.25rem" }
          }}
        >
          Campus Hub
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            component={Link}
            href="/"
            disableRipple
            sx={{ 
              color: currentRoute === "/" ? "#fff" : "rgba(255,255,255,0.6)",
              fontWeight: currentRoute === "/" ? 600 : 400,
              textTransform: "none",
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              minWidth: { xs: "auto", sm: "64px" },
              px: { xs: 1, sm: 2 },
              "&:hover": { color: "#fff", background: "rgba(255,255,255,0.05)" }
            }}
          >
            Feed
          </Button>
          <Button
            component={Link}
            href="/priority"
            disableRipple
            sx={{ 
              color: currentRoute === "/priority" ? "#fff" : "rgba(255,255,255,0.6)",
              fontWeight: currentRoute === "/priority" ? 600 : 400,
              textTransform: "none",
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              minWidth: { xs: "auto", sm: "64px" },
              px: { xs: 1.5, sm: 2 },
              background: currentRoute === "/priority" ? "rgba(255, 255, 255, 0.05)" : "transparent",
              border: currentRoute === "/priority" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid transparent",
              borderRadius: "8px",
              "&:hover": { color: "#fff", background: "rgba(255, 255, 255, 0.08)" }
            }}
          >
            Priority Inbox
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
