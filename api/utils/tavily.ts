import { tavily } from '@tavily/core';

// Initialize Tavily client
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

export async function searchWeb(query: string) {
  try {
    const response = await tavilyClient.search(query, {
      search_depth: 'basic',
      max_results: 5,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
    });

    return response.results.map((result: any) => ({
      title: result.title,
      content: result.content,
      url: result.url,
    }));
  } catch (error) {
    console.error('Tavily Search Error:', error);
    return { error: 'Failed to search.' };
  }
}

export const searchToolDefinition = {
  type: 'function',
  function: {
    name: 'searchWeb',
    description: 'Search the internet for real-time information, news, or specific facts.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query string.',
        },
      },
      required: ['query'],
    },
  },
};

