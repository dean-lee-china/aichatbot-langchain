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

import "cheerio";
import { pull } from "langchain/hub";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { formatDocumentsAsString } from "langchain/util/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { StringOutputParser } from "@langchain/core/output_parsers";

const loader = new CheerioWebBaseLoader(
    "https://lilianweng.github.io/posts/2023-06-23-agent/"
);


/*const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});*/



/*const docs = await loader.load();
const splits = await textSplitter.splitDocuments(docs);
const vectorStore = await MemoryVectorStore.fromDocuments(
      splits,
      new OpenAIEmbeddings()
);
const retriever = vectorStore.asRetriever();*/


//
// A RAG chain for the normal talkings
//
//const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
/*nst ragChain = await createStuffDocumentsChain({
      llm,
      prompt,
      outputParser: new StringOutputParser(),
});*/


//
// Create a sub-chain for holding the historical message
// Using this chain we can ask follow-up questions that 
// reference past messages and have them reformulated into 
// standalone questions
//
/*const contextualizeQSystemPrompt = `Given a chat history and the latest user question
which might reference context in the chat history, formulate a standalone question
which can be understood without the chat history. Do NOT answer the question,
just reformulate it if needed and otherwise return it as is.`;

const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      ["system", contextualizeQSystemPrompt],
      new MessagesPlaceholder("chat_history"),
      ["human", "{words}"],
]);

const contextualizeQChain = contextualizeQPrompt
  .pipe(llm)
  .pipe( new StringOutputParser());


//
// A RAG chain for the normal talkings
//

{context}`;

const qaPrompt = ChatPromptTemplate.fromMessages([
    ["system", qaSystemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{words}"],
]);

const contextualizedQuestion = ( input: Record<string, unknown> ):any => {

    if ("chat_history" in input) {
        return contextualizeQChain;
    } 
    return input.question;
};

const ragChain = RunnableSequence.from([

    // Pass-through args
    RunnablePassthrough.assign({
        context: ( input: Record<string, unknown> ) => {
            if ( "chat_history" in input ) {
                const chain = contextualizedQuestion( input );
                return chain.pipe(retriever).pipe( formatDocumentsAsString );
            }
            return "";
        },
    }),

    qaPrompt,
    llm,
]);

let chat_history:any = [];*/


//-- Step1: creating a LLM with OpenAI GPT-4o
const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

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
const messageHistory: Record<string, InMemoryChatMessageHistory> = {};
const dialog = Prompt.pipe( llm );
const mainChain = new RunnableWithMessageHistory({
    runnable: dialog,
    getMessageHistory: async( sessionId: string ) => {
        if( messageHistory[ sessionId ] === undefined ){
            messageHistory[ sessionId ] = new InMemoryChatMessageHistory();
        }
        return messageHistory[ sessionId ];
    },
    inputMessagesKey: "input",
    historyMessagesKey: "chat_history",
});


/*
 * Key Function: talk to AI 
 *
 * INPUT1 who   (string): Slack user id
 * INPUT2 words (string): The content that passed to LLM
 *
 * OUTPUT: (string): The response of the LLM
 */
export async function talk2AI( who:string,  words:string ) {

	console.log( `> Slack user [${who}] asked Columbus: ${words}` );

    const config = { configurable: { sessionId: who }};
    const reply = await mainChain.invoke( { input: words }, config );    

    return reply.content;

}

