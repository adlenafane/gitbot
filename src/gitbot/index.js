import Botkit from 'botkit';

const cb = (err, res) => {
  if (err) {
    console.log(err);
  }
  console.log(res);
};

let user = {};

class GitBot {

  constructor (configuration) {
    this.configuration = configuration || { debug: false };
    this.controller = Botkit.slackbot(this.configuration);

    this.GITBOT_USERNAME = process.env.GITBOT_USERNAME || 'JF';
    this.GITBOT_ICON_URL = process.env.GITBOT_ICON_URL || 'https://octodex.github.com/images/topguntocat.png';
    this.GITBOT_GITHUB_TOKEN = process.env.GITBOT_GITHUB_TOKEN;
    this.GITBOT_SLACK_TOKEN = process.env.GITBOT_SLACK_TOKEN;
    this.GITBOT_WEBSERVER_PORT = process.env.GITBOT_WEBSERVER_PORT;
    this.GITBOT_WEBSERVER_HOOK_URL = process.env.GITBOT_WEBSERVER_HOOK_URL;

    // connect the bot to a stream of messages
    this.gitBot = this.controller.spawn({
      token: this.GITBOT_SLACK_TOKEN,
      incoming_webhook: { url: this.GITBOT_WEBSERVER_HOOK_URL }
    }).startRTM((err) => {
      if (err) { throw new Error('Could not connect to Slack'); }
    });

    this.setUp();
    this.setUpWebserver(this.GITBOT_WEBSERVER_PORT);
  }

  setUp () {
    const githubUsernamePattern = 'github username is (.*)';
    this.controller.hears(githubUsernamePattern, 'direct_message,direct_mention,mention', (bot, message) => {
      const match = message.text.match(new RegExp(githubUsernamePattern));
      const githubUsername = match.length ? match[1] : null;
      const answer = githubUsername ? `Got it! It's , ${githubUsername} right?` : `Sorry I didn't get it. Could you use the following format ${githubUsernamePattern}`;

      bot.api.users.info({ user: message.user }, (err, res) => {
        user = res.user;
        bot.reply(message, answer);
      });
    });
  }

  setUpWebserver (port) {
    this.controller.setupWebserver(port, (err, webserver) => {
      webserver.get('/', (req, res) => {
        this.gitBot.sendWebhook({
          text: `This is an incoming webhook for ${user.id}`,
          channel: user.id,
          user: user.id,
          username: this.GITBOT_USERNAME,
          icon_url: this.GITBOT_ICON_URL
        }, cb);

        res.send('ok');
      });
    });
  }
}

export default GitBot;
