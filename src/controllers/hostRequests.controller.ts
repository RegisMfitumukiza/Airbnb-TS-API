import { Request, Response } from "express";
import { HostRequestStatus, Role, NotificationType } from "../generated/prisma/client.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { sendEmail } from "../config/email.js";

import {
  adminNewHostRequestEmail,
  hostRequestApprovedEmail,
  hostRequestRejectedEmail,
  hostRequestSubmittedEmail
} from "../templates/hostRequestEmails.js";

import { getAdminUsersService } from "../services/users.service.js";
import { createNotificationService } from "../services/notifications.service.js";

import {
  approveHostRequestService,
  createHostRequestService,
  getAllHostRequestsService,
  getHostRequestByIdService,
  getMyHostRequestsService,
  getPendingHostRequestByUserService,
  rejectHostRequestService,
  getPendingHostRequestsCountService
} from "../services/hostRequests.service.js";

export const createHostRequest = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    if (req.user.role === Role.HOST) {
      throw new APIError("You are already a host", 400);
    }

    const existingPending = await getPendingHostRequestByUserService(
      req.user.userId
    );

    if (existingPending) {
      throw new APIError("You already have a pending host request", 400);
    }

    const request = await createHostRequestService(
      req.user.userId,
      req.body.message
    );

    logger.info("Host request submitted", {
      requestId: request.id,
      userId: req.user.userId
    });

    try {
      await sendEmail(
        request.user.email,
        "Host Request Submitted",
        hostRequestSubmittedEmail(request.user.name)
      );
    } catch (error) {
      logger.error("Host request submitted email failed", {
        requestId: request.id,
        userId: req.user.userId,
        error
      });
    }

    const admins = await getAdminUsersService();

    await Promise.all(
      admins.map(async (admin) => {
        await createNotificationService({
          userId: admin.id,
          title: "New host request",
          message: `${request.user.name} submitted a request to become a host.`,
          type: NotificationType.HOST_REQUEST
        });

        try {
          await sendEmail(
            admin.email,
            "New Host Request",
            adminNewHostRequestEmail(admin.name, request.user.name)
          );
        } catch (error) {
          logger.error("Admin host request email failed", {
            adminId: admin.id,
            requestId: request.id,
            error
          });
        }
      })
    );

    res.status(201).json({
      success: true,
      message: "Host request submitted successfully",
      data: request
    });
  }
);

export const getHostRequests = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    if (req.user.role !== Role.ADMIN) {
      logger.warn("Non-admin tried to access host requests", {
        userId: req.user.userId,
        role: req.user.role
      });

      throw new APIError("Access denied: admins only", 403);
    }

    const status = req.query.status
      ? (String(req.query.status).toUpperCase() as HostRequestStatus)
      : undefined;

    if (status && !Object.values(HostRequestStatus).includes(status)) {
      throw new APIError("Invalid host request status", 400);
    }

    const requests = await getAllHostRequestsService(status);

    logger.info("Host requests retrieved", {
      adminId: req.user.userId,
      status: status || "ALL",
      count: requests.length
    });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  }
);


export const getPendingHostRequestsCount = asyncHandler(
  async (_req: Request, res: Response) => {
    const count = await getPendingHostRequestsCountService();

    res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  }
);

export const getMyHostRequests = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    const requests = await getMyHostRequestsService(req.user.userId);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  }
);

export const approveHostRequest = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    if (req.user.role !== Role.ADMIN) {
      logger.warn("Non-admin tried to approve host request", {
        userId: req.user.userId,
        role: req.user.role,
        requestId: req.params.id
      });

      throw new APIError("Access denied: admins only", 403);
    }

    const requestId = req.params.id as string;

    const request = await getHostRequestByIdService(requestId);

    if (!request) {
      throw new APIError("Host request not found", 404);
    }

    if (request.status !== HostRequestStatus.PENDING) {
      throw new APIError("Only pending requests can be approved", 400);
    }

    const result = await approveHostRequestService(
      requestId,
      req.user.userId
    );

    logger.info("Host request approved", {
      requestId,
      adminId: req.user.userId,
      approvedUserId: request.userId
    });

    try {
      await sendEmail(
        request.user.email,
        "Host Request Approved",
        hostRequestApprovedEmail(request.user.name)
      );
    } catch (error) {
      logger.error("Host request approved email failed", {
        requestId,
        userId: request.userId,
        error
      });
    }

    res.status(200).json({
      success: true,
      message: "Host request approved successfully",
      data: result
    });
  }
);

export const rejectHostRequest = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new APIError("Unauthorized", 401);

    if (req.user.role !== Role.ADMIN) {
      logger.warn("Non-admin tried to reject host request", {
        userId: req.user.userId,
        role: req.user.role,
        requestId: req.params.id
      });

      throw new APIError("Access denied: admins only", 403);
    }

    const requestId = req.params.id as string;
    const reason = req.body.reason as string | undefined;

    const request = await getHostRequestByIdService(requestId);

    if (!request) {
      throw new APIError("Host request not found", 404);
    }

    if (request.status !== HostRequestStatus.PENDING) {
      throw new APIError("Only pending requests can be rejected", 400);
    }

    const rejected = await rejectHostRequestService(
      requestId,
      req.user.userId,
      reason
    );

    logger.info("Host request rejected", {
      requestId,
      adminId: req.user.userId,
      rejectedUserId: request.userId,
      reason: reason || null
    });

    try {
      await sendEmail(
        request.user.email,
        "Host Request Update",
        hostRequestRejectedEmail(request.user.name, reason)
      );
    } catch (error) {
      logger.error("Host request rejected email failed", {
        requestId,
        userId: request.userId,
        error
      });
    }

    res.status(200).json({
      success: true,
      message: "Host request rejected successfully",
      data: rejected
    });
  }
);