import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { 
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";

import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import {
    RunnableSequence,
    RunnablePassthrough,
    RunnableConfig,
    Runnable,
} from "@langchain/core/runnables";

import dotenv from "dotenv";
import { getTimeStamp } from "./utils.js";
import { loadUserMemory, updateUserMemory } from "./redis.js"; 

//-- Load OpenAI configuration
dotenv.config();
if ( !process.env.OPENAI_API_KEY ){
    throw new Error("FATAL ERROR: Missing OpenAI API TOKEN!");
}

//-- Step1: creating a LLM with OpenAI GPT-4o
const llm = new ChatOpenAI({ 
    model: "gpt-4o", 
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
});

//-- Step2: creating a prompt for talk
const systemInitMsg = `Your name is Columbus.Christopher, who use to be 
a great captain that sailed across the oceans. You are now an AI assistant
created by dean1873 in 2025.`

const Prompt = ChatPromptTemplate.fromMessages([
    [ "system", systemInitMsg, ],
    [ "placeholder", "{chat_history}" ],
    [ "human", "{input}" ],
]);


//-- Step3: create an LLM chain with history
//-- chat history will be stored in Redis server
//-- It is redis that responsible for storing the 
//-- memory to hard drives.
const messageHistory: Record<string, InMemoryChatMessageHistory> = {};
const dialog = Prompt.pipe( llm );

const mainChain = new RunnableWithMessageHistory({
    runnable: dialog,
    getMessageHistory: async ( sessionId: string ) => {
        // If no memory exist for the current user, try to load memory
        // from redis server.
        if( messageHistory[ sessionId ] === undefined ){
            messageHistory[ sessionId ] = await loadUserMemory( sessionId );
        }
        return messageHistory[ sessionId ];
    },
    inputMessagesKey: "input",
    historyMessagesKey: "chat_history",
});

//-- Sync the user Memory with Redis for some minutes
let interval = 0;
if( process.env.MEM_SYNC_INTERVAL === undefined ){
    interval = 60000;
} else {
    interval = parseInt( process.env.MEM_SYNC_INTERVAL ); 
}

setInterval(()=>{
    updateUserMemory( messageHistory );
}, interval );


/*
 * Key Function: talk to AI 
 *
 * INPUT1 who   (string): Slack user id
 * INPUT2 words (string): The content that passed to LLM
 *
 * OUTPUT: (string): The response of the LLM
 */
export async function talk2AI( who:string,  words:string ) {

    const timeStamp = getTimeStamp();
	console.log( `[ ${timeStamp} ]> Slack user [${who}] asked Columbus: ${words}` );
    
    const id = who;// + "-" + timeStamp;
    const config = { configurable: { sessionId: id }};

    const reply = await mainChain.invoke( { input: words }, config );    

    return reply.content;

}


