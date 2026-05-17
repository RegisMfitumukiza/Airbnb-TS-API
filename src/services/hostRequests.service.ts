import {
  HostRequestStatus,
  NotificationType,
  Role
} from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export const createHostRequestService = async (
  userId: string,
  message?: string
) => {
  return prisma.hostRequest.create({
    data: {
      userId,
      message
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });
};

export const getPendingHostRequestByUserService = async (userId: string) => {
  return prisma.hostRequest.findFirst({
    where: {
      userId,
      status: HostRequestStatus.PENDING
    }
  });
};

export const getPendingHostRequestsCountService = async () => {
  return prisma.hostRequest.count({
    where: {
      status: "PENDING",
    },
  });
};

export const getAllHostRequestsService = async (
  status?: HostRequestStatus
) => {
  return prisma.hostRequest.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatar: true
        }
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

export const getMyHostRequestsService = async (userId: string) => {
  return prisma.hostRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
};

export const getHostRequestByIdService = async (id: string) => {
  return prisma.hostRequest.findUnique({
    where: { id },
    include: {
      user: true
    }
  });
};

export const approveHostRequestService = async (
  requestId: string,
  adminId: string
) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.hostRequest.update({
      where: { id: requestId },
      data: {
        status: HostRequestStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date()
      },
      include: {
        user: true
      }
    });

    const updatedUser = await tx.user.update({
      where: { id: request.userId },
      data: {
        role: Role.HOST
      }
    });

    await tx.notification.create({
      data: {
        userId: request.userId,
        title: "Host request approved",
        message: "Congratulations! Your request to become a host was approved.",
        type: NotificationType.HOST_APPROVED
      }
    });

    return {
      request,
      user: updatedUser
    };
  });
};

export const rejectHostRequestService = async (
  requestId: string,
  adminId: string,
  reason?: string
) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.hostRequest.update({
      where: { id: requestId },
      data: {
        status: HostRequestStatus.REJECTED,
        reviewedById: adminId,
        reviewedAt: new Date()
      },
      include: {
        user: true
      }
    });

    await tx.notification.create({
      data: {
        userId: request.userId,
        title: "Host request rejected",
        message:
          reason ||
          "Your request to become a host was rejected. Please contact support for more details.",
        type: NotificationType.HOST_REJECTED
      }
    });

    return request;
  });
};