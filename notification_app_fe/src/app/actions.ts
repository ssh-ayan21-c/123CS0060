"use server";

import axios from "axios";
import { Log, initLog } from "logging-middleware";
import { APINotification } from "@/utils/priority";

const API_URL = "http://4.224.186.213/evaluation-service/notifications";

export async function fetchNotifications(
  page: number = 1,
  limit: number = 10,
  notificationType?: string
) {
  const token = process.env.NEXT_PUBLIC_APP_TOKEN;
  
  if (!token) {
    console.error("No API token found in environment variables");
    return { error: "Configuration Error: No API Token" };
  }

  initLog(token);

  try {
    const params: any = { page, limit };
    if (notificationType) {
      params.notification_type = notificationType;
    }

    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });

    // We can assume response.data contains the list according to Stage 6 document
    // Let's log that we fetched notifications successfully from backend
    await Log("backend", "info", "service", `Fetched notifications (page: ${page}, limit: ${limit})`);
    
    return { data: response.data.notifications || response.data };
  } catch (error: any) {
    await Log("backend", "error", "service", `Failed to fetch notifications: ${error.message}`);
    return { error: error.response?.data || error.message || "Unknown error" };
  }
}

export async function logFrontendAction(
  level: any,
  pkg: any,
  message: string
) {
  const token = process.env.NEXT_PUBLIC_APP_TOKEN;
  if (!token) return { success: false, error: "No Token" };
  
  initLog(token);
  try {
    const result = await Log("frontend", level, pkg, message);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
