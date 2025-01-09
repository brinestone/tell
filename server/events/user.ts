import { CustomAsyncWorkloadEvent } from '@netlify/async-workloads';

export interface SignedUpEvent extends CustomAsyncWorkloadEvent {
  eventName: 'accounts.sign-up';
  eventData: {
    userId: number;
    email: string;
    countryCode: string;
  }
}

export interface UserDeletedEvent extends CustomAsyncWorkloadEvent {
  eventName: 'accounts.deleted';
  eventData: {
    userId: number;
    email: string;
    credentials: string;
  }
}
