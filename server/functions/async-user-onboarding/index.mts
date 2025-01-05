import { SignedUpEvent }                        from '@events/user';
import { doCreateUserWallet }                   from '@handlers/wallet.mjs';
import { AsyncWorkloadConfig, asyncWorkloadFn } from '@netlify/async-workloads';
import defaultLogger                            from '@logger/common';

// Performs user onboarding tasks on sign-up
export default asyncWorkloadFn<SignedUpEvent>(async ({ step, eventData }) => {
  await step.run('create-wallet', async () => {
    await doCreateUserWallet(eventData.userId);
    defaultLogger.info(`Wallet created for ${eventData.email}`);
  });
});

export const asyncWorkloadConfig: AsyncWorkloadConfig<SignedUpEvent> = {
  events: ['accounts.sign-up']
}
