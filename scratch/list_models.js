
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const GEMINI_API_KEY = 'AIzaSyDjHXyOV--SwLixgV9AdnsqtoAuEwNvJ0U';
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}

listModels();
