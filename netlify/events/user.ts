import { CustomAsyncWorkloadEvent } from '@netlify/async-workloads';

export interface SignedUpEvent extends CustomAsyncWorkloadEvent {
  eventName: 'accounts.sign-up';
  eventData: {
    userId: number;
    email: string;
  }
}
