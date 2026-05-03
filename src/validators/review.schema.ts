import { z } from 'zod';
import { registry } from '../docs/registry.js';


export const createReviewSchema = z.object({
    body: registry.register("createReviewInput", z.object({
        rating: z.coerce.number().int().min(1).max(5, {
            message: "Rating must be between 1 and 5"
        }),
        comment: z.string().min(10, {
            message: "comment must atleast have 10 characters"
        })
    })),

    params: z.object({
        listingId: z.uuid({
            message: "Listing must be a valid UUID"
        })
    })
});
   

