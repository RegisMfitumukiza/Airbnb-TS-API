import { Router } from "express";

import authRoutes from "./auth.routes.js";
import userRoutes from "./users.routes.js";
import listingRoutes from "./listings.routes.js";
import bookingRoutes from "./bookings.routes.js";
import reviewRoutes from "./reviews.routes.js";
import aiRoutes from "./ai.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/listings", listingRoutes);
router.use("/bookings", bookingRoutes);
router.use("/reviews", reviewRoutes);
router.use("/ai", aiRoutes);

export default router;