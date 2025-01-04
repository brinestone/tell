import { AsyncWorkloadsClient, CustomAsyncWorkloadEvent } from '@netlify/async-workloads';

let client: AsyncWorkloadsClient;

export function useAwlClient<T extends CustomAsyncWorkloadEvent>() {
  if (client) return client as AsyncWorkloadsClient<T>;
  if (process.env['NODE_ENV'] == 'development') {
    client = new AsyncWorkloadsClient({
      apiKey: process.env['AWL_API_KEY'],
      baseUrl: process.env['ORIGIN']
    });
  } else {
    client = new AsyncWorkloadsClient();
  }
  return useAwlClient<T>();
}
