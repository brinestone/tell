export const TM_USER_ACCOUNT_CONNECTION_VERIFIED_MSG = (userName: string) => {
  return `Your account has been successfully linked ${userName}.`
}
export const TM_USER_ACCOUNT_DISCONNECTION_MSG = `Account disconnection successful. Goodbye`;
export const TM_UNKNOWN_COMMAND_MSG = 'Unknown command. Please try again with a command from the menu';
export const TM_ACCOUNT_ALREADY_EXISTS_MD_MSG = (userName: string, email: string) => {
  return `Your account is already linked to *${userName} - (${email})*. If you want to disconnect your Telegram account from the linked account please click the *Disconnect* button on your account's settings page.`
};
