import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

import {
  naturalLanguageSearchService,
  generateListingDescriptionService,
  aiChatService
} from "../services/ai.service.js";

export const naturalLanguageSearch = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { query } = req.body;

    logger.info("AI natural language search started", {
      query
    });

    const result = await naturalLanguageSearchService(query);

    logger.info("AI natural language search completed", {
      count: result.count
    });

    res.status(200).json({
      success: true,
      message: "AI search completed successfully",
      data: result
    });
  }
);

export const generateListingDescription = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    logger.info("AI listing description request started", {
      title: req.body.title
    });

    const description = await generateListingDescriptionService(req.body);

    logger.info("AI listing description generated successfully");

    res.status(200).json({
      success: true,
      message: "Listing description generated successfully",
      data: {
        description
      }
    });
  }
);

export const chat = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { message, sessionId } = req.body;

    logger.info("AI chat request started", {
      sessionId
    });

    const result = await aiChatService(message, sessionId);

    logger.info("AI chat response generated", {
      sessionId
    });

    res.status(200).json({
      success: true,
      message: "AI chat response generated successfully",
      data: result
    });
  }
);