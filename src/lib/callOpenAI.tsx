import OpenAI from 'openai';

export default async function callOpenAI(string: string, model: string) {

  const apiKey: string | null = localStorage.getItem('OPENAI_API_KEY');

  if (apiKey !== null) {
    const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: [{ role: 'user', content: string }],
      model: model,
    };
    try {
      const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
      console.log(chatCompletion);
      return chatCompletion;
    } catch (error) {
      console.error('Failed to get response from OpenAI:', error);
      throw error;
    }
  } else {
    throw new Error('API key not found');
  }
}
