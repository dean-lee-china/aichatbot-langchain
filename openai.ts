import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import {
	  RunnableSequence,
	    RunnablePassthrough,
} from "@langchain/core/runnables";

import "cheerio";
import { pull } from "langchain/hub";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { StringOutputParser } from "@langchain/core/output_parsers";

const loader = new CheerioWebBaseLoader(
    "https://lilianweng.github.io/posts/2023-06-23-agent/"
);

const llmModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0
});

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const messageHistory: Record<string, InMemoryChatMessageHistory> = {};

const context = ChatPromptTemplate.fromMessages([
    [ "system", `Your name is Columbus, an AI Chatbot powered by openAI.`, ],
    [ "placeholder", "{chat_history}" ],
    [ "human", "{input}" ],
]);

const dialog = context.pipe( llmModel );

const withMessageHistory = new RunnableWithMessageHistory({
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


const docs = await loader.load();
const splits = await textSplitter.splitDocuments(docs);
const vectorStore = await MemoryVectorStore.fromDocuments(
      splits,
      new OpenAIEmbeddings()
);
const retriever = vectorStore.asRetriever();
const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");



export async function talk2AI( who:string,  words:string ) {

	console.log( `> Slack user [${who}] asked Columbus: ${words}` );
    const config = { configurable:{ sessionId: who }};

	const response = await withMessageHistory.invoke( { input: words }, config );
	return response.content;
}

