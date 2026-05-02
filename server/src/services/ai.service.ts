import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function askAI(userMessage: string, financialContext: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are ClearBudget AI, a friendly and knowledgeable personal finance assistant.
You have access to the user's financial data below. Give clear, actionable advice.
Be conversational but concise. Use dollar amounts and percentages when helpful.

USER FINANCIAL CONTEXT:
${financialContext}`,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}
