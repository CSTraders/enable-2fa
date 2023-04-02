#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import { enableTwoFactor, finalizeTwoFactor } from './enable';

const basicInstructions = `
This script will enable two-factor authentication for a Steam account.
You will need to provide your username and password, and then you will
be prompted for an activation code. You will receive this code via SMS.
`;

const accountInstructions = `
Please note that your account must already have a phone number associated
with it. If you do not have a phone number associated with your account,
you will need to add one before you can enable two-factor authentication.
`;

async function main() {
  console.log(basicInstructions.trim() + '\n');

  let shouldContinue: boolean = true;
  while (shouldContinue) {
    shouldContinue = false;

    console.log(accountInstructions.trim() + '\n');
    const { username, password } = await prompts([
      {
        type: 'text',
        name: 'username',
        message: 'What is your username?',
      },
      {
        type: 'password',
        name: 'password',
        message: 'What is your password?',
      },
    ]);

    if (!username || !password) {
      console.log('Username and password are required.');
      continue;
    }

    console.log('Enabling two-factor authentication...');
    const result = await enableTwoFactor(username, password);
    if (result.response.status !== 1) {
      console.log(`Unexpected response status: ${result.response.status}`);
      continue;
    }

    console.log('Two-factor authentication has been initialized.');
    const { activationCode } = await prompts([
      {
        type: 'text',
        name: 'activationCode',
        message: 'What is your activation code?',
      },
    ]);

    if (!activationCode) {
      console.log('Activation code is required.');
      continue;
    }

    console.log('Finalizing two-factor authentication...');
    await finalizeTwoFactor(result, activationCode);
    console.log('Two-factor authentication has been finalized.\n');

    const outputPath = path.resolve(path.normalize(`${username}_${Date.now()}.json`));

    console.log('IMPORTANT INFORMATION');
    console.log('=====================');
    console.log('Output path: ' + outputPath);
    console.log('Shared secret: ' + result.response.shared_secret.toString('base64'));
    console.log('Identity secret: ' + result.response.identity_secret.toString('base64'));
    console.log('Revocation code: ' + result.response.revocation_code.toString('base64'));
    console.log('=====================\n');

    try {
      fs.writeFileSync(outputPath, JSON.stringify(result.response, null, 2));
    } catch (err) {
      console.error(`Failed to write to ${outputPath}`);
    }

    const { shouldContinuePrompt } = await prompts([
      {
        type: 'confirm',
        name: 'shouldContinuePrompt',
        message: 'Would you like to enable two-factor authentication for another account?',
        initial: false,
      },
    ]);

    shouldContinue = shouldContinuePrompt;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
