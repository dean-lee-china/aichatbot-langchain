import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

const llmModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0
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

const config = {
    configurable: {
        sessionId: "dean1873",
    }
};


export async function talk2AI( words: string ) {

	console.log( `Somebody asked Columbus: ${words}` );
	const response = await withMessageHistory.invoke( { input: words }, config );
	return response.content;
}

