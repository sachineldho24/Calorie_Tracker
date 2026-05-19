import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

async function run() {
  try {
    const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`);
    const data = await models.json();
    console.log(data.models.map(m => m.name));
  } catch (e) {
    console.error(e);
  }
}
run();
