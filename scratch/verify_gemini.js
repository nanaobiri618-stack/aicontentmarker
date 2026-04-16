
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotEnv = require('dotenv');
const path = require('path');

// Load .env
dotEnv.config({ path: path.join(__dirname, '../.env') });

async function verifyConnection() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  console.log('Using API Key starts with:', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 8) + '...' : 'NONE');
  
  if (!GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = "Say 'Connection Successful'";
    const result = await model.generateContent(prompt);
    console.log('Response:', result.response.text());
  } catch (error) {
    console.error('Verification failed:', error.message);
  }
}

verifyConnection();
