import { Router } from "express";

import {
  approveHostRequest,
  createHostRequest,
  getHostRequests,
  getMyHostRequests,
  getPendingHostRequestsCount,
  rejectHostRequest,
} from "../../controllers/hostRequests.controller.js";

import {
  authenticate,
  requireAdmin,
  requireGuest,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  createHostRequestSchema,
  rejectHostRequestSchema,
} from "../../validators/hostRequest.schema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Host Requests
 *     description: Host request management
 */

/**
 * @swagger
 * /api/v1/host-requests:
 *   post:
 *     summary: Submit a host request
 *     tags: [Host Requests]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  authenticate,
  requireGuest,
  validate(createHostRequestSchema),
  createHostRequest
);

/**
 * @swagger
 * /api/v1/host-requests:
 *   get:
 *     summary: Get all host requests
 *     tags: [Host Requests]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", authenticate, requireAdmin, getHostRequests);

/**
 * @swagger
 * /api/v1/host-requests/me:
 *   get:
 *     summary: Get my host requests
 *     tags: [Host Requests]
 *     security:
 *       - bearerAuth: []
 */
router.get("/me", authenticate, getMyHostRequests);

/**
 * @swagger
 * /api/v1/host-requests/pending/count:
 *   get:
 *     summary: Get pending host requests count
 *     tags: [Host Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending host requests count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 */
router.get(
  "/pending/count",
  authenticate,
  requireAdmin,
  getPendingHostRequestsCount
);


/**
 * @swagger
 * /api/v1/host-requests/{id}/approve:
 *   patch:
 *     summary: Approve host request
 *     tags: [Host Requests]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/:id/approve", authenticate, requireAdmin, approveHostRequest);

/**
 * @swagger
 * /api/v1/host-requests/{id}/reject:
 *   patch:
 *     summary: Reject host request
 *     tags: [Host Requests]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:id/reject",
  authenticate,
  requireAdmin,
  validate(rejectHostRequestSchema),
  rejectHostRequest
);

export default router;