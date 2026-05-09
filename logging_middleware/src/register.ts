import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const REGISTER_URL = 'http://4.224.186.213/evaluation-service/register';
const AUTH_URL = 'http://4.224.186.213/evaluation-service/auth';

async function generateToken() {
  const {
    EMAIL,
    NAME,
    MOBILE_NO,
    GITHUB_USERNAME,
    ROLL_NO,
    ACCESS_CODE,
  } = process.env;

  if (!EMAIL || !NAME || !MOBILE_NO || !GITHUB_USERNAME || !ROLL_NO || !ACCESS_CODE) {
    console.error('Missing required environment variables in .env');
    console.error('Please ensure EMAIL, NAME, MOBILE_NO, GITHUB_USERNAME, ROLL_NO, and ACCESS_CODE are set.');
    process.exit(1);
  }

  try {
    console.log('1. Registering...');
    const registerPayload = {
      email: EMAIL,
      name: NAME,
      mobileNo: MOBILE_NO,
      githubUsername: GITHUB_USERNAME,
      rollNo: ROLL_NO,
      accessCode: ACCESS_CODE,
    };

    let clientID: string;
    let clientSecret: string;

    try {
      const registerRes = await axios.post(REGISTER_URL, registerPayload);
      clientID = registerRes.data.clientID;
      clientSecret = registerRes.data.clientSecret;
      console.log('Registration successful!');
    } catch (e: any) {
      // It might fail if already registered. We can't retrieve clientID/secret again according to instructions.
      // In that case, the user should put them in the .env manually if they saved it before.
      if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
        console.log('Registration failed or already registered, using CLIENT_ID and CLIENT_SECRET from .env');
        clientID = process.env.CLIENT_ID;
        clientSecret = process.env.CLIENT_SECRET;
      } else {
        console.error('Registration failed:', e.response?.data || e.message);
        console.error('If you already registered, please add CLIENT_ID and CLIENT_SECRET to your .env');
        process.exit(1);
      }
    }

    console.log('2. Authenticating...');
    const authPayload = {
      email: EMAIL,
      name: NAME,
      rollNo: ROLL_NO,
      accessCode: ACCESS_CODE,
      clientID,
      clientSecret,
    };

    const authRes = await axios.post(AUTH_URL, authPayload);
    const accessToken = authRes.data.access_token;
    console.log('Authentication successful!');

    // Write token to .env or a config file
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Update or append APP_TOKEN
    if (envContent.includes('APP_TOKEN=')) {
      envContent = envContent.replace(/APP_TOKEN=.*/, `APP_TOKEN=${accessToken}`);
    } else {
      envContent += `\nAPP_TOKEN=${accessToken}\n`;
    }

    // Save client ID and secret as well so they aren't lost
    if (!envContent.includes('CLIENT_ID=')) {
      envContent += `\nCLIENT_ID=${clientID}\nCLIENT_SECRET=${clientSecret}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('Token successfully saved to .env as APP_TOKEN');

  } catch (error: any) {
    console.error('Error during generation:', error.response?.data || error.message);
  }
}

generateToken();
