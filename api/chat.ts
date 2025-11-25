import { useContext } from '@modern-js/plugin-express/server';
import { OpenAI } from 'openai';

// System Prompt for Interest Coach
const SYSTEM_PROMPT = `你是一位专业且充满热情的“兴趣教练”。你的目标是帮助用户发现、探索并深入发展他们的兴趣爱好。

请遵循以下指导原则：
1. **探索发现**：通过询问用户的性格、可用时间、预算和过往偏好，挖掘潜在的兴趣领域。
2. **具体指导**：针对特定兴趣，提供从入门到精通的步骤建议，包括推荐书籍、视频教程、社区资源以及必要的装备清单。
3. **激励鼓舞**：在用户遇到困难时给予鼓励，帮助他们设定可实现的小目标，庆祝每一个微小的进步。
4. **深度拓展**：对于已有兴趣的用户，推荐进阶技巧、相关的细分领域，或者如何连接更广阔的圈子。

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

    console.log('Calling OpenAI...');
    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      model: model,
      stream: true,
      // @ts-ignore
      reasoning_effort: "medium"
    });

    console.log('OpenAI Stream Created');

    // Use Node.js Response object directly to bypass BFF serialization
    if (res && typeof res.setHeader === 'function') {
       res.setHeader('Content-Type', 'text/plain; charset=utf-8');
       res.setHeader('Cache-Control', 'no-cache');
       res.setHeader('Connection', 'keep-alive');

       let hasStartedThinking = false;
       let hasFinishedThinking = false;

       try {
         for await (const chunk of completion) {
            // @ts-ignore
            const reasoningContent = chunk.choices[0]?.delta?.reasoning_content;
            const content = chunk.choices[0]?.delta?.content;

            if (reasoningContent) {
              if (!hasStartedThinking) {
                res.write('<think>');
                hasStartedThinking = true;
              }
              res.write(reasoningContent);
            } else if (hasStartedThinking && !hasFinishedThinking && (content || content === '')) {
              res.write('</think>');
              hasFinishedThinking = true;
            }

            if (content) {
              res.write(content);
            }
         }

         if (hasStartedThinking && !hasFinishedThinking) {
            res.write('</think>');
         }

         res.end();
         // Return nothing or explicit indicator to stop further processing
         return;
       } catch (err) {
         console.error('Stream Error:', err);
         res.end();
         return;
       }
    } else {
      // Fallback if context/res is not available (should not happen in express/bff mode)
      console.error('Context.res is missing, cannot stream directly');
      return { error: 'Server Context Error' };
    }

  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Internal Server Error' };
  }
};
