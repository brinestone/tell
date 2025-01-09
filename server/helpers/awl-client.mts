import { AsyncWorkloadsClient, CustomAsyncWorkloadEvent } from '@netlify/async-workloads';

let client: AsyncWorkloadsClient;

export function useAwlClient<T extends CustomAsyncWorkloadEvent>() {
  if (client) return client as AsyncWorkloadsClient<T>;
  client = new AsyncWorkloadsClient({
    apiKey: process.env['AWL_API_KEY'],
    baseUrl: process.env['ORIGIN']
  });
  return useAwlClient<T>();
}
