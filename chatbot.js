const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Configuration, OpenAIApi } = require("openai");
let setting = require("./key.json");

const client = new Client({
  authStrategy: new LocalAuth()
});

if (setting.openAPIKey == "ISI_KEY") {
  throw new Error("Isi openAPIKey di key.json dengan API key dari https://beta.openai.com/account/api-keys");
}

const configuration = new Configuration({
  apiKey: setting.openAPIKey,
});

const openai = new OpenAIApi(configuration);

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', async message => {
  console.log("\x1b[32m", '[RECEIVED MESSAGE]:', message.body);
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: message.body,
      temperature: 0.3,
      max_tokens: 2000,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
    const replyText = completion.data.choices[0].text.trim();
    if (replyText.length > 4096) {
      throw new Error("Teks terlalu panjang untuk di-reply.");
    }
    console.log("\x1b[36m%s\x1b[0m", '[REPLY FROM BOT]:', replyText);
    message.reply(replyText);
  } catch (err) {
    console.log("\x1b[31m", '[ERROR]:', err.message);
    message.reply("Maaf, terjadi kesalahan. " + err.message);
  }
});

client.on('auth_failure', msg => {
  console.error('Auth failure: ', msg);
});

client.on('disconnected', reason => {
  console.log('Client was logged out', reason);
});

client.initialize();
