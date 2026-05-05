import { ChatGroq } from "@langchain/groq";
import 'dotenv/config';


export const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    streaming: true,
});

export default llm;