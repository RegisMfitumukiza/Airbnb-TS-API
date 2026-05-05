import { Router } from "express";

import {
  naturalLanguageSearch,
  generateListingDescription,
  chat
} from "../../controllers/ai.controller.js";

import { authenticate, requireHost } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  naturalLanguageSearchSchema,
  generateListingDescriptionSchema,
  aiChatSchema
} from "../../validators/ai.schema.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: AI
 *     description: AI-powered Airbnb features
 */

/**
 * @swagger
 * /api/v1/ai/listings/search:
 *   post:
 *     summary: Natural language listing search
 *     description: Converts a natural language query into listing filters and returns matching listings.
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 example: I need a cheap apartment in Kigali for 2 guests with wifi
 *     responses:
 *       200:
 *         description: AI search completed successfully
 */
router.post(
  "/listings/search",
  validate(naturalLanguageSearchSchema),
  naturalLanguageSearch
);

/**
 * @swagger
 * /api/v1/ai/listings/description:
 *   post:
 *     summary: Generate listing description
 *     description: Generates a professional Airbnb-style listing description.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *               - type
 *               - guests
 *               - amenities
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 example: Modern Apartment in Kigali
 *               location:
 *                 type: string
 *                 example: Kigali
 *               type:
 *                 type: string
 *                 enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *                 example: APARTMENT
 *               guests:
 *                 type: integer
 *                 example: 2
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["wifi", "parking", "kitchen"]
 *               price:
 *                 type: number
 *                 example: 50
 *     responses:
 *       200:
 *         description: Listing description generated successfully
 */
router.post(
  "/listings/description",
  authenticate,
  requireHost,
  validate(generateListingDescriptionSchema),
  generateListingDescription
);

/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: AI chatbot
 *     description: Chat with an Airbnb assistant using available listings as context.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - sessionId
 *             properties:
 *               message:
 *                 type: string
 *                 example: Do you have any cheap apartments in Kigali?
 *               sessionId:
 *                 type: string
 *                 example: user-session-123
 *     responses:
 *       200:
 *         description: AI chat response generated successfully
 */
router.post("/chat", authenticate, validate(aiChatSchema), chat);

export default router;