import 'dotenv/config';

import OpenAI from 'openai';

export function createOpenAIInstance() {
  try {
    const openai = new OpenAI();
    return openai;
  } catch (error) {
    console.error('Failed to create OpenAI instance: ', error);
    return null;
  }
}
