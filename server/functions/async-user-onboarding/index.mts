import { SignedUpEvent } from '@events/user';
import { doCreateUserWallet } from '@handlers/wallet.mjs';
import defaultLogger from '@logger/common';
import { AsyncWorkloadConfig, asyncWorkloadFn } from '@netlify/async-workloads';

// Performs user onboarding tasks on sign-up
export default asyncWorkloadFn<SignedUpEvent>(async ({ step, eventData: { email, userId } }) => {
  await step.run('create-wallet', async () => {
    await doCreateUserWallet(userId);
    defaultLogger.info(`wallet created`, { email });
  });
});

export const asyncWorkloadConfig: AsyncWorkloadConfig<SignedUpEvent> = {
  events: ['accounts.sign-up']
}
