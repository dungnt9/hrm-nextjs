import * as signalR from "@microsoft/signalr";
import { getToken } from "./keycloak";

let connection: signalR.HubConnection | null = null;

export const createSignalRConnection = () => {
  if (connection) {
    return connection;
  }

  const hubUrl =
    process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL ||
    "http://localhost:5005/hubs/notification";

  connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => getToken() || "",
    })
    .withAutomaticReconnect()
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
