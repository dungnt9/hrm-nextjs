import * as signalR from "@microsoft/signalr";
import { getAccessToken } from "./auth";

let connection: signalR.HubConnection | null = null;

export const createSignalRConnection = () => {
  if (connection) {
    return connection;
  }

  // Try to use NotificationHub through API Gateway, fallback to direct URL
  let hubUrl =
    process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL ||
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/hubs/notification`;

  // Legacy support for direct notification service URL
  if (process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL?.includes("5005")) {
    hubUrl = process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => getAccessToken() || "",
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (context) => {
        if (context.previousRetryCount === 0) return 1000; // Retry after 1s
        if (context.previousRetryCount === 1) return 3000; // Retry after 3s
        return 5000; // Then retry after 5s
      },
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

  return connection;
};

export const startConnection = async () => {
  const conn = createSignalRConnection();

  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start();
      console.log("SignalR Connected");
    } catch (err) {
      console.error("SignalR Connection Error:", err);
      setTimeout(startConnection, 5000);
    }
  }
};

export const stopConnection = async () => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.stop();
    console.log("SignalR Disconnected");
  }
};

export const onNotification = (callback: (notification: any) => void) => {
  const conn = createSignalRConnection();
  conn.on("ReceiveNotification", callback);
};

export const offNotification = (callback: (notification: any) => void) => {
  const conn = createSignalRConnection();
  conn.off("ReceiveNotification", callback);
};

export const markAsRead = async (notificationId: string) => {
  const conn = createSignalRConnection();
  if (conn.state === signalR.HubConnectionState.Connected) {
    await conn.invoke("MarkAsRead", notificationId);
  }
};

export const getUnreadNotifications = async () => {
  const conn = createSignalRConnection();
  if (conn.state === signalR.HubConnectionState.Connected) {
    return await conn.invoke("GetUnreadNotifications");
  }
  return [];
};
