"use client";

import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import {
  startConnection,
  stopConnection,
  onNotification,
  offNotification,
} from "@/lib/signalr";

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleNotification = useCallback(
    (notification: any) => {
      dispatch(
        addNotification({
          id: notification.Id || crypto.randomUUID(),
          title: notification.Title,
          message: notification.Message,
          type: notification.Type,
          data: notification.Data,
          isRead: false,
          createdAt: notification.Timestamp || new Date().toISOString(),
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    if (isAuthenticated) {
      startConnection();
      onNotification(handleNotification);

      return () => {
        offNotification(handleNotification);
        stopConnection();
      };
    }
  }, [isAuthenticated, handleNotification]);

  return <>{children}</>;
}
