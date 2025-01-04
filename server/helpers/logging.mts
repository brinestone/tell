import pino from "pino";

export function useLogger(name?: string) {
  return pino();
}
