import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  JsonOutputParser,
  StringOutputParser
} from "@langchain/core/output_parsers";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

import llm from "../config/ai.js";
import { prisma } from "../lib/prisma.js";
import { APIError } from "../utils/ApiError.js";
import { ListingType, Prisma } from "../generated/prisma/client.js";

type SearchFilters = {
  location?: string;
  type?: ListingType;
  guests?: number;
  maxPrice?: number;
};

type GenerateListingDescriptionData = {
  title: string;
  location: string;
  type: string;
  guests: number;
  amenities: string[];
  price: number;
};

const forbiddenKeywords = [
  "hack",
  "password",
  "token",
  "api key",
  "lyrics",
  "politics"
];

const sanitizeText = (value: string): string => {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
};

const hasForbiddenKeywords = (text: string): boolean => {
  const lowerText = text.toLowerCase();

  return forbiddenKeywords.some((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
};

/* ================= NATURAL LANGUAGE SEARCH ================= */

const searchPrompt = ChatPromptTemplate.fromTemplate(`
You are a search assistant for an Airbnb-like platform.
Extract search filters from the user's natural language query.

User query: {query}

Return a JSON object with these optional fields:
- location: string
- type: one of APARTMENT, HOUSE, VILLA, CABIN
- guests: number
- maxPrice: number

Rules:
- Return ONLY valid JSON.
- No explanation.
- No markdown.
- If user says cheap or budget, use maxPrice: 50.
- If user says luxury or expensive, use maxPrice: 300.
- If a field is not mentioned, omit it.

Example:
{{"location":"Kigali","type":"APARTMENT","guests":2,"maxPrice":50}}
`);

const searchChain = searchPrompt.pipe(llm).pipe(new JsonOutputParser());

export const naturalLanguageSearchService = async (query: string) => {
  const cleanQuery = sanitizeText(query);

  if (hasForbiddenKeywords(cleanQuery)) {
    throw new APIError("Search query is not allowed", 400);
  }

  const filters = (await searchChain.invoke({
    query: cleanQuery
  })) as SearchFilters;

  const where: Prisma.ListingWhereInput = {};

  if (filters.location) {
    where.location = {
      contains: filters.location,
      mode: "insensitive"
    };
  }

  if (
    filters.type &&
    Object.values(ListingType).includes(filters.type as ListingType)
  ) {
    where.type = filters.type as ListingType;
  }

  if (filters.guests) {
    where.guests = {
      gte: filters.guests
    };
  }

  if (filters.maxPrice) {
    where.pricePerNight = {
      lte: filters.maxPrice
    };
  }

  const listings = await prisma.listing.findMany({
    where,
    take: 10,
    orderBy: {
      createdAt: "desc"
    },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    }
  });

  return {
    query: cleanQuery,
    extractedFilters: filters,
    count: listings.length,
    results: listings
  };
};

/* ================= LISTING DESCRIPTION GENERATOR ================= */

const descriptionPrompt = ChatPromptTemplate.fromTemplate(`
You are a professional copywriter for an Airbnb-like platform.

IMPORTANT RULES:
- Only write listing descriptions for accommodation/rental properties.
- Do not answer unrelated prompts.
- If the input is unrelated to a rental listing, respond exactly with:
INVALID_LISTING_INPUT

Listing details:
- Title: {title}
- Location: {location}
- Type: {type}
- Max guests: {guests}
- Amenities: {amenities}
- Price per night: {price} USD

Write a 3-paragraph description:
1. Opening hook — what makes this place special
2. The space — describe the property and its features
3. The location — what guests can do nearby

Keep it between 150-200 words.
Be specific and inviting.
Do not use generic phrases like "perfect getaway".
`);

const descriptionChain = descriptionPrompt
  .pipe(llm)
  .pipe(new StringOutputParser());

export const generateListingDescriptionService = async (
  data: GenerateListingDescriptionData
) => {
  const sanitizedData: GenerateListingDescriptionData = {
    title: sanitizeText(data.title),
    location: sanitizeText(data.location),
    type: sanitizeText(data.type),
    guests: data.guests,
    amenities: data.amenities.map((item) => sanitizeText(item)),
    price: data.price
  };

  const combinedText = [
    sanitizedData.title,
    sanitizedData.location,
    sanitizedData.type,
    sanitizedData.amenities.join(" ")
  ].join(" ");

  if (hasForbiddenKeywords(combinedText)) {
    throw new APIError(
      "Input is not related to listing description generation",
      400
    );
  }

  const description = await descriptionChain.invoke({
    title: sanitizedData.title,
    location: sanitizedData.location,
    type: sanitizedData.type,
    guests: sanitizedData.guests,
    amenities: sanitizedData.amenities.join(", "),
    price: sanitizedData.price
  });

  if (description.includes("INVALID_LISTING_INPUT")) {
    throw new APIError(
      "Input is not related to listing description generation",
      400
    );
  }

  if (description.length < 50) {
    throw new APIError("AI failed to generate a valid description", 500);
  }

  return description.trim();
};

/* ================= CHATBOT ================= */

const sessionHistories = new Map<string, InMemoryChatMessageHistory>();

const getSessionHistory = (sessionId: string): InMemoryChatMessageHistory => {
  if (!sessionHistories.has(sessionId)) {
    sessionHistories.set(sessionId, new InMemoryChatMessageHistory());
  }

  return sessionHistories.get(sessionId)!;
};

const chatPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful Airbnb assistant.

You help guests:
- find listings
- understand available properties
- ask about price, guests, location, amenities
- understand how bookings work

Available listings context:
{listingsContext}

Rules:
- Be friendly and concise.
- Use only the listings context provided.
- If you do not know something, say so.
- Do not invent listings.
- Do not discuss unrelated topics.`
  ],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"]
]);

const chatChain = chatPrompt.pipe(llm);

const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chatChain,
  getMessageHistory: getSessionHistory,
  inputMessagesKey: "input",
  historyMessagesKey: "chat_history"
});

export const aiChatService = async (message: string, sessionId: string) => {
  const cleanMessage = sanitizeText(message);

  if (hasForbiddenKeywords(cleanMessage)) {
    throw new APIError("Message is not allowed", 400);
  }

  const listings = await prisma.listing.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc"
    },
    select: {
      title: true,
      location: true,
      pricePerNight: true,
      type: true,
      guests: true,
      amenities: true
    }
  });

  const listingsContext = listings.length
    ? listings
        .map(
          (listing) =>
            `- ${listing.title} in ${listing.location}: $${listing.pricePerNight}/night, ${listing.type}, up to ${listing.guests} guests, amenities: ${listing.amenities.join(", ")}`
        )
        .join("\n")
    : "No listings are currently available.";

  const reply = await chainWithHistory.invoke(
    {
      input: cleanMessage,
      listingsContext
    },
    {
      configurable: {
        sessionId
      }
    }
  );

  const content =
    typeof reply.content === "string"
      ? reply.content
      : JSON.stringify(reply.content);

  return {
    reply: content,
    sessionId
  };
};