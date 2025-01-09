import { UserDeletedEvent } from "@events/user";
import { doRemovePaymentMethods } from "@handlers/payment.mjs";
import { doRemoveAccountConnections } from "@handlers/user.mjs";
import { doDeleteUserWallet } from "@handlers/wallet.mjs";
import { useUsersDb } from "@helpers/db.mjs";
import defaultLogger from "@logger/common";
import { AsyncWorkloadConfig, asyncWorkloadFn } from "@netlify/async-workloads";
import { federatedCredentials, users } from "@schemas/users";
import { eq } from "drizzle-orm";

export default asyncWorkloadFn<UserDeletedEvent>(async ({ step, eventData: { userId, email, credentials } }) => {
  await step.run('delete-wallet', async () => {
    await doDeleteUserWallet(userId);
    defaultLogger.info(`deleted wallet for user`, { email });
  });

  await step.run('remove-account-connections', async () => {
    await doRemoveAccountConnections(userId);
    defaultLogger.info(`deleted connected accounts for user`, { email });
  });

  await step.run('remove-payment-methods', async () => {
    const cnt = await doRemovePaymentMethods(userId);
    defaultLogger.info(`deleted ${cnt} payment methods`, { email });
  })

  await step.run('remove-user-account', async () => {
    const db = useUsersDb();
    await db.transaction(t => {
      return Promise.all([
        t.delete(users).where(eq(users.id, userId)),
        t.delete(federatedCredentials).where(eq(federatedCredentials.id, credentials as string))
      ]);
    });
    defaultLogger.info(`deleted user account`, { email });
  })
});

export const asyncWorkloadConfig: AsyncWorkloadConfig<UserDeletedEvent> = {
  events: ['accounts.deleted']
}
