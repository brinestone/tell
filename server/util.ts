import { createHash } from "crypto";

export function hashThese(...args: string[]) {
  const cipher = createHash('md5');
  args.forEach(arg => cipher.update(arg));
  return cipher.digest('hex');
}
