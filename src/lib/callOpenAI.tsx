import OpenAI from 'openai';

export async function exponentialRetryWrapper<Args extends Array<any>, Output>(
  func: (...args: Args) => Promise<Output>,
  args: Args,
  retries: number,
): Promise<Output> {
  const t1 = Date.now();
  try {
    const res = await func(...args);
    console.log(
      `Exponential retry wrapper completed in ${
        Date.now() - t1
      } ms. Retries remaining: ${retries - 1}`,
    );
    return res;
  } catch (error) {
    console.log(`Error in exponentialRetryWrapper. The error is: ${error}}`);
    if (retries > 0) {
      console.log(`Retrying ${func.name} in ${2 ** (10 - retries)}ms`);
      await new Promise((r) => setTimeout(r, 2 ** (10 - retries)));
      return await exponentialRetryWrapper(func, args, retries - 1);
    } else {
      throw error;
    }
  }
}

export async function callOpenAI(userPrompt: string, systemPrompt: string, model: string) {

  const apiKey: string | null = localStorage.getItem('OPENAI_API_KEY');

  if (apiKey !== null) {
    const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: [
        { role: 'system', content: systemPrompt},
        { role: 'user', content: userPrompt }],
      model: model,
      temperature: 0.0
    };
    try {
      const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
      return chatCompletion;
    } catch (error) {
      console.error('Failed to get response from OpenAI:', error);
      throw error;
    }
  } else {
    throw new Error('API key not found');
  }
}

