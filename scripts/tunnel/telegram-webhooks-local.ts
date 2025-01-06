import { TunnelInit } from './index';

type WebHookSetupResponse = {
  ok: boolean;
  result: boolean;
  description: string;
}

const init: TunnelInit = async (url) => {
  console.log('Setting up telegram webhooks tunnel');

  // Remove existing integration
  await fetch(`https://api.telegram.org/bot${process.env['TM_BOT_TOKEN']}/setWebhook?url=`, { method: 'GET' }).then(r => r.json())
    .then(console.log)
    .catch(console.error);

  // Setup webhooks
  const response: WebHookSetupResponse = await fetch(`https://api.telegram.org/bot${process.env['TM_BOT_TOKEN']}/setWebhook?secret_token=${process.env['TM_SECRET']}&url=${encodeURIComponent(`${url}/api/webhooks/tm`)}`, { method: 'GET' })
    .then(response => response.json());

  if (!response.ok) throw new Error(response.description);
  console.log(response);
}

export default init;
