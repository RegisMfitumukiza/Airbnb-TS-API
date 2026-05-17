import { NotificationType } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

type CreateNotificationData = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
};

export const createNotificationService = async (
  data: CreateNotificationData
) => {
  return prisma.notification.create({
    data
  });
};

export const getUserNotificationsService = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
};

export const getUnreadNotificationsCountService = async (userId: string) => {
  return prisma.notification.count({
    where: {
      userId,
      read: false
    }
  });
};

export const markNotificationAsReadService = async (
  notificationId: string,
  userId: string
) => {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId
    },
    data: {
      read: true,
      readAt: new Date()
    }
  });
};

export const markAllNotificationsAsReadService = async (userId: string) => {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false
    },
    data: {
      read: true,
      readAt: new Date()
    }
  });
};