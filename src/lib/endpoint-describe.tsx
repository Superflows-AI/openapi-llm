import OpenAI from 'openai';
// import browser from 'webextension-polyfill';

// interface StorageResult {
//   OPENAI_API_KEY?: string;
// }


export default async function callOpenAI(string: string, model: string) {
  console.log('Collecting API Key');

  const apiKey: string | null = localStorage.getItem('OPENAI_API_KEY');

  if (apiKey !== null) {
    console.log('Initialising OpenAI');
    const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });

    console.log('Setting OpenAI Params');
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: [{ role: 'user', content: string }],
      model: model,
    };

    console.log('Querying OpenAI');
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


// export default async function callOpenAI(string: string, model: string) {
//   console.log('Collecting API Key');
//   console.log('API KEY FROM LOCAL STORAGE:', localStorage.getItem('OPENAI_API_KEY'));
//   // Directly use browser.storage provided by webextension-polyfill

//   const apiKey: string | undefined = localStorage.getItem('OPENAI_API_KEY');

//   if (apiKey && typeof apiKey === 'string') {
//     // API key is found and is a string
//     // Proceed with the rest of the code
//   } else {
//     throw new Error('API key not found or is not a string');
//   }

//   // const apiKey: string | undefined = await new Promise<string | undefined>((resolve, reject) => {
//   //   browser.storage.local.get(['OPENAI_API_KEY']).then((result: StorageResult) => {
//   //     if (result.OPENAI_API_KEY && typeof result.OPENAI_API_KEY === 'string') {
//   //       resolve(result.OPENAI_API_KEY); // Ensure the key is a string
//   //     } else {
//   //       reject('API key not found or is not a string');
//   //     }
//   //   }).catch((error) => {
//   //     console.error('Error fetching API key from storage:', error);
//   //     reject('Failed to fetch API key');
//   //   });
//   // });

//   // Ensure apiKey is not undefined before proceeding
//   if (!apiKey) {
//     throw new Error('API key is undefined or invalid.');
//   }
//   console.log('Initialising OpenAI');
//   // Initialize the OpenAI API client with the fetched API key
//   const openai = new OpenAI({
//     apiKey: apiKey
//   });

//   console.log('Setting OpenAI Params');
//   const params: OpenAI.Chat.ChatCompletionCreateParams = {
//     messages: [{ role: 'user', content: string }],
//     model: model,
//   };

//   console.log('Querying OpenAI');
//   try {
//     const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
//     console.log(chatCompletion);
//     return chatCompletion;
//   } catch (error) {
//     console.error('Failed to get response from OpenAI:', error);
//     throw error;
//   }
// }