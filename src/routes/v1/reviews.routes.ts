import { Router } from "express";
import { deleteReview } from "../../controllers/reviews.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     description: Users can delete their own review. ADMIN can delete any review.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Review ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 */
router.delete("/:id", authenticate, deleteReview);

export default router;