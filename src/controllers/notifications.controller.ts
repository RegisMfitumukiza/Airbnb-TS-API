import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

import {
  getUnreadNotificationsCountService,
  getUserNotificationsService,
  markAllNotificationsAsReadService,
  markNotificationAsReadService
} from "../services/notifications.service.js";

export const getMyNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      logger.warn("Unauthorized notifications access attempt");
      throw new APIError("Unauthorized", 401);
    }

    const notifications = await getUserNotificationsService(
      req.user.userId
    );

    logger.info("Notifications retrieved", {
      userId: req.user.userId,
      count: notifications.length
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  }
);

export const getUnreadNotificationsCount = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      logger.warn("Unauthorized unread notifications count access attempt");
      throw new APIError("Unauthorized", 401);
    }

    const count = await getUnreadNotificationsCountService(
      req.user.userId
    );

    logger.info("Unread notifications count retrieved", {
      userId: req.user.userId,
      unreadCount: count
    });

    res.status(200).json({
      success: true,
      unreadCount: count
    });
  }
);

export const markNotificationAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      logger.warn("Unauthorized notification read attempt");
      throw new APIError("Unauthorized", 401);
    }

    const notificationId = req.params.id as string;

    await markNotificationAsReadService(
      notificationId,
      req.user.userId
    );

    logger.info("Notification marked as read", {
      notificationId,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "Notification marked as read"
    });
  }
);

export const markAllNotificationsAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      logger.warn("Unauthorized mark all notifications attempt");
      throw new APIError("Unauthorized", 401);
    }

    await markAllNotificationsAsReadService(req.user.userId);

    logger.info("All notifications marked as read", {
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  }
);
