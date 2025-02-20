import dotenv from "dotenv"; 
import { createClient } from 'redis';
import { getTimeStamp } from "./utils.js";
import { BaseMessage } from "@langchain/core/messages";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";

//-- Connect to local redis server.
dotenv.config();
if ( !process.env.REDIS_HOST || !process.env.REDIS_PORT ){
    throw new Error("FATAL ERROR: Missing REDIS_HOST or REDIS_PORT!");
}
const redisUrl = "redis://" + process.env.REDIS_HOST + ":" + process.env.REDIS_PORT;
const redisClient = createClient({ url: redisUrl });
redisClient.on( "error", (err) => console.log( "FATAL ERROR: Can NOT connect to redis server", err ) );

await redisClient.connect();

//-- Load all the chat history from Redis corresponding with Slack User Id
//-- Key: { lack user ID }
//-- Value: { chat_history }
export async function loadUserMemory( slackUserId:string ):Promise<InMemoryChatMessageHistory> {
    const ts = getTimeStamp() 
    console.log( `[ ${ts} ]> Load user memory from redis.....` );
    const memStr =  await redisClient.get( slackUserId );
    const memHistory = new InMemoryChatMessageHistory();

    if( memStr != null ){
        const memories:BaseMessage[] = JSON.parse( memStr );
        memHistory.addMessages( memories );
    } else {
        console.log( `No memory for user ${slackUserId}, create a blank one` );
    }

    return memHistory;
}

//-- Save all the latest user memories to Redis
//-- as JSON strings.
//
//-- IMPORTANT: Only save the message array.
//-- InMemoryChatMessageHistory.messages:[ HumanMessage{}, AIMessage{}.... ]
//
export async function updateUserMemory( memory:any ){
    const slackUserIds = Object.keys( memory );

    const ts = getTimeStamp();
    console.log( `[ ${ts} ]> Sync user memory ----> redis.....` );
    console.log( `Slack users: ${ slackUserIds }`);

    slackUserIds.forEach( slackUserId  => {
        const objStr = JSON.stringify( memory[slackUserId].messages );
        //console.log( "convert class InMemoryChatMessageHistory" );
        //console.log( objStr );
        //console.log( memory[slackUserId] );
        redisClient.set( slackUserId, objStr );
    });
}


