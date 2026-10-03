import { createInterface } from "node:readline/promises"

import { TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions/index.js"

// One-time interactive login. Prints a session string for TELEGRAM_SESSION.
// Use a SECONDARY Telegram account: the session grants full access to it.
const { TELEGRAM_API_ID, TELEGRAM_API_HASH } = process.env
if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
  console.error("Set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env.local first (my.telegram.org)")
  process.exit(1)
}

const rl = createInterface({ input: process.stdin, output: process.stdout })
const client = new TelegramClient(
  new StringSession(""),
  Number(TELEGRAM_API_ID),
  TELEGRAM_API_HASH,
  { connectionRetries: 3 },
)

await client.start({
  phoneNumber: () => rl.question("Telefone (com +55...): "),
  phoneCode: () => rl.question("Código recebido no Telegram: "),
  password: () => rl.question("Senha 2FA (se tiver): "),
  onError: (error) => console.error(error),
})

console.log("\nLogin ok. Cole esta linha no .env.local (é secreta, não compartilhe):\n")
console.log(`TELEGRAM_SESSION=${client.session.save()}\n`)
rl.close()
await client.disconnect()
process.exit(0)
