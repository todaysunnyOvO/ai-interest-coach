import { useContext } from '@modern-js/plugin-express/server';
import { OpenAI } from 'openai';
import { searchWeb, searchToolDefinition } from './utils/tavily';

// System Prompt for Interest Coach
const SYSTEM_PROMPT = `你是一位专业且充满热情的“兴趣教练”。你的目标是帮助用户发现、探索并深入发展他们的兴趣爱好。

请遵循以下指导原则：
1. **探索发现**：通过询问用户的性格、可用时间、预算和过往偏好，挖掘潜在的兴趣领域。
2. **具体指导**：针对特定兴趣，提供从入门到精通的步骤建议，包括推荐书籍、视频教程、社区资源以及必要的装备清单。
3. **激励鼓舞**：在用户遇到困难时给予鼓励，帮助他们设定可实现的小目标，庆祝每一个微小的进步。
4. **深度拓展**：对于已有兴趣的用户，推荐进阶技巧、相关的细分领域，或者如何连接更广阔的圈子。
5. **实时信息**：当需要查询实时信息、新闻或事实性知识时，请务必使用搜索工具来获取最新数据。

在回答时，请保持语气亲切、耐心且富有条理。使用清晰的Markdown格式（如列表、粗体）来组织内容。如果用户表示需要思考或正在犹豫，请给予充分的理解和引导。`;

export const post = async (reqOption: any) => {
  try {
    console.log('API Request Received');

    // @ts-ignore - Modern.js server runtime helper
    const context = useContext();
    const { res } = context;

    // Parse Body
    const body = reqOption?.data || {};
    console.log('Request Body:', JSON.stringify(body));
    const { message } = body as { message: string };

    if (!message) {
       return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    const apiKey = process.env.VOLCENGINE_API_KEY;
    const model = process.env.VOLCENGINE_MODEL_ID || "doubao-seed-1-6-251015";

    if (!apiKey) {
       return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 500 });
    }

    const client = new OpenAI({ apiKey, baseURL: 'https://ark.cn-beijing.volces.com/api/v3' });

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message }
    ];

    const tools = [searchToolDefinition];

    console.log('Calling OpenAI (First Pass)...');

    // Use Node.js Response object directly
    if (res && typeof res.setHeader === 'function') {
       res.setHeader('Content-Type', 'text/plain; charset=utf-8');
       res.setHeader('Cache-Control', 'no-cache');
       res.setHeader('Connection', 'keep-alive');

       let hasStartedThinking = false;
       let hasFinishedThinking = false;

       // Track the final accumulated response for history
       let finalContent = "";
       let toolCallsMap: Record<number, any> = {};
       let isToolCalling = false;

       try {
         const stream1 = await client.chat.completions.create({
            messages: messages,
            model: model,
            // @ts-ignore
            tools: tools,
            tool_choice: "auto",
            stream: true,
            // @ts-ignore
            reasoning_effort: "medium"
         });

         for await (const chunk of stream1) {
            // @ts-ignore
            const reasoningContent = chunk.choices[0]?.delta?.reasoning_content;
            const delta = chunk.choices[0]?.delta;
            const content = delta?.content;
            const toolCalls = delta?.tool_calls;

            // Handle Thinking/Reasoning (Stream immediately)
            if (reasoningContent) {
              if (!hasStartedThinking) {
                res.write('<think>');
                hasStartedThinking = true;
              }
              res.write(reasoningContent);
            } else if (hasStartedThinking && !hasFinishedThinking && (content || toolCalls)) {
              res.write('</think>');
              hasFinishedThinking = true;
            }

            // Handle Tool Calls
            if (toolCalls) {
              isToolCalling = true;
              for (const tc of toolCalls) {
                const idx = tc.index;
                if (!toolCallsMap[idx]) {
                   toolCallsMap[idx] = {
                     index: idx,
                     id: tc.id,
                     type: tc.type,
                     function: { name: tc.function?.name || "", arguments: "" }
                   };
                }
                if (tc.id) toolCallsMap[idx].id = tc.id;
                if (tc.function?.name) toolCallsMap[idx].function.name = tc.function.name;
                if (tc.function?.arguments) toolCallsMap[idx].function.arguments += tc.function.arguments;
              }
            }

            // Handle Content (Stream if not tool calling, otherwise buffer?)
            // Usually content and tool_calls are mutually exclusive in a single turn output from model's perspective,
            // but sometimes they stream partial content before switching to tool.
            // For safety: Stream content as it arrives.
            if (content) {
              res.write(content);
              finalContent += content;
            }
         }

         // Close think tag if still open
         if (hasStartedThinking && !hasFinishedThinking) {
            res.write('</think>');
            hasFinishedThinking = true;
         }

         // If Tool Calls detected
         if (isToolCalling && Object.keys(toolCallsMap).length > 0) {
             const toolCallsArray = Object.values(toolCallsMap).map(tc => {
                const { index, ...rest } = tc;
                return rest;
             });

             // Add the assistant's message with tool calls to history
             messages.push({
               role: 'assistant',
               content: finalContent || null,
               tool_calls: toolCallsArray
             });

             // Notify user we are searching
             res.write('\n\n*正在搜索相关信息...*\n\n');

             console.log('Executing Tools:', JSON.stringify(toolCallsArray));

             // Execute Tools
             for (const toolCall of toolCallsArray) {
                if (toolCall.function.name === 'searchWeb') {
                  const args = JSON.parse(toolCall.function.arguments);
                  console.log(`Searching for: ${args.query}`);
                  const searchResult = await searchWeb(args.query);

                  messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(searchResult)
                  });
                }
             }

             console.log('Calling OpenAI (Second Pass)...');

             // Second Stream
             const stream2 = await client.chat.completions.create({
                messages: messages,
                model: model,
                stream: true,
                // @ts-ignore
                reasoning_effort: "medium"
             });

             let hasStartedThinking2 = false;
             let hasFinishedThinking2 = false;

             for await (const chunk of stream2) {
               // @ts-ignore
               const reasoningContent = chunk.choices[0]?.delta?.reasoning_content;
               const content = chunk.choices[0]?.delta?.content;

               if (reasoningContent) {
                 if (!hasStartedThinking2) {
                   res.write('<think>');
                   hasStartedThinking2 = true;
                 }
                 res.write(reasoningContent);
               } else if (hasStartedThinking2 && !hasFinishedThinking2 && content) {
                 res.write('</think>');
                 hasFinishedThinking2 = true;
               }

               if (content) {
                 res.write(content);
               }
             }

             if (hasStartedThinking2 && !hasFinishedThinking2) {
                res.write('</think>');
             }
         }

         res.end();
         return;

       } catch (err) {
         console.error('Stream Error:', err);
         res.end();
         return;
       }
    } else {
      console.error('Context.res is missing, cannot stream directly');
      return { error: 'Server Context Error' };
    }

  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Internal Server Error' };
  }
};
