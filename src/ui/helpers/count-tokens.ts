import { Endpoint } from "../../utils/types";
import tokenizer from "gpt-tokenizer";

export interface ChatMessage {
  role?: 'system' | 'user' | 'assistant'
  name?: string
  content: string
}

export default function countTokens(endpoint: Endpoint): number {

  if (endpoint) {};

  const message = 'Here is a test of the token counter';

  let gptMessage: ChatMessage[];

  if (typeof message === "string") {
    gptMessage = [{ role: "user", content: message }];
  } else {
    gptMessage = message as ChatMessage[];
  }

  // Per the docs, the tokenizer should be the same for 3.5-turbo and 4.
  const encoded = tokenizer.encodeChat(gptMessage, "gpt-4");

  console.log('In get token count, token count:', encoded.length)
  return encoded.length;
}


// interface WasmModuleExports {
//   text: (input: string, model: string) => number; // Adjust the types based on actual expected input/output
// }

// function isWasmModuleExports(exports: any): exports is WasmModuleExports {
//   return 'text' in exports && typeof exports.text === 'function';
// }

// async function loadWasmModule(path: string): Promise<WasmModuleExports | null> {
//   try {
//     const response = await fetch(path);
//     const bytes = await response.arrayBuffer();
//     const wasmModule = await WebAssembly.instantiate(bytes);
//     const exports = wasmModule.instance.exports;
//     if (isWasmModuleExports(exports)) {
//       return exports;
//     } else {
//       console.error("WASM exports do not match the expected interface.");
//       return null;
//     }
//   } catch (error) {
//     console.error("Error loading WASM module:", error);
//     return null;
//   }
//   }



// export default async function countTokens(endpoint: Endpoint): Promise<number> {
//   if (endpoint) {};
//     //console.log(endpoint);
//   const wasmExports = await loadWasmModule('openapi-llm/dist/assets/tiktoken_bg-2d006734.wasm');
//   if (!wasmExports) {
//     console.log('!wasmExports -- not working')
//     return 0;
//   }

//   // Assuming the token counting function is exposed from the WASM module.
//   // You may need to adjust the function call depending on how it's actually exposed.
//   const text = 'Here is a test of the token counter';
//   const tokenCount = wasmExports.text(text, 'gpt-4');
//   console.log('Token counter output:', tokenCount)
//   return tokenCount;
// }