import { SignedUpEvent } from '@events/user';
import { doCreateUserWallet } from '@handlers/wallet.mjs';
import { AsyncWorkloadConfig, asyncWorkloadFn } from '@netlify/async-workloads';

// Performs user onboarding tasks on sign-up
export default asyncWorkloadFn<SignedUpEvent>(async ({ step, eventData }) => {
  await step.run('create-wallet', async () => {
    await doCreateUserWallet(eventData.userId);
  })
});

export const asyncWorkloadConfig: AsyncWorkloadConfig<SignedUpEvent> = {
  events: ['accounts.sign-up']
}
