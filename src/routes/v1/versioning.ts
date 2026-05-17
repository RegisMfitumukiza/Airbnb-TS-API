import { Router } from "express";

import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import listingsRoutes from "./listings.routes.js";
import bookingsRoutes from "./bookings.routes.js";
import reviewsRoutes from "./reviews.routes.js";
import aiRoutes from "./ai.routes.js";
import hostRequestsRoutes from "./hostRequests.routes.js";
import notificationsRoutes from "./notifications.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/listings", listingsRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/ai", aiRoutes);
router.use("/host-requests", hostRequestsRoutes);
router.use("/notifications", notificationsRoutes);

export default router;