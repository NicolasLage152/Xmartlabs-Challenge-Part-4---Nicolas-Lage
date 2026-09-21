import * as dotenv from 'dotenv';
import * as path from 'path';


dotenv.config({ path: path.resolve(__dirname, '../../.env') });


export const ENV = {
  STANDARD_USER: process.env.SAUCE_STANDARD_USER as string,
  GLITCH_USER: process.env.SAUCE_GLITCH_USER as string,
  PASSWORD: process.env.SAUCE_PASSWORD as string,
};

const missingVars = Object.entries(ENV).filter(([, value]) => !value);
if (missingVars.length > 0) {
  const keys = missingVars.map(([key]) => key).join(', ');
  throw new Error(`Missing required environment variables: ${keys}. Please verify your .env file or CI secrets.`);
}

