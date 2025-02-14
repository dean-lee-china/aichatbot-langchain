import dotenv from "dotenv"; 
import { getTimeStamp } from "./utils.js";
import { UpstashRedisChatMessageHistory } from "@langchain/community/stores/message/upstash_redis";

dotenv.config();
//-- Load Redis configuration
if ( !process.env.UPSTASH_REDIS_REST_URL ||
     !process.env.UPSTASH_REDIS_REST_TOKEN ){
    throw new Error("FATAL ERROR: Missing Upstash Redis REST URL or REST TOKEN!");
}

const initMemoryTimeStamp = "server-"+getTimeStamp();
const redisMemory = new UpstashRedisChatMessageHistory({
    sessionId:initMemoryTimeStamp,
    config: {
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }
});

//-- Load all the memories of the conversation 
//-- from Redis database
//
// Returns Promise<BaseMessage[]>, An array of BaseMessage 
// instances representing the chat history of everyone, this
// action should be taken only at the begginning as the database
// of the memory will become bigger and bigger.
//
// Key: { lack user ID }
// Value: { chat_history }
const oldMemories = await redisMemory.getMessages();

//-- Load all the chat history from Redis
export async function updateMemory( slackUserId: string ){

}

//-- Append the lastest talk to memories
export function append2Memory( talk: BaseMessage ){

}
