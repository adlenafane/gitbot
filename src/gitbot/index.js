import Botkit from 'botkit';
import express from 'express';
import bodyParser from 'body-parser';

const cb = (err, res) => {
  if (err) {
    console.log(err);
  }
  console.log(res);
};

class GitBot {

  constructor (configuration) {
    this.configuration = configuration || { debug: false };
    this.controller = Botkit.slackbot(this.configuration);

    this.GITBOT_USERNAME = process.env.GITBOT_USERNAME || 'JF';
    this.GITBOT_ICON_URL = process.env.GITBOT_ICON_URL || 'https://octodex.github.com/images/topguntocat.png';
    this.GITBOT_GITHUB_TOKEN = process.env.GITBOT_GITHUB_TOKEN || configuration.GITBOT_GITHUB_TOKEN;
    this.GITBOT_SLACK_TOKEN = process.env.GITBOT_SLACK_TOKEN || configuration.GITBOT_SLACK_TOKEN;
    this.GITBOT_WEBSERVER_PORT = process.env.GITBOT_WEBSERVER_PORT || 8901;
    this.GITBOT_WEBSERVER_HOOK_URL = process.env.GITBOT_WEBSERVER_HOOK_URL || configuration.GITBOT_WEBSERVER_HOOK_URL;

    // connect the bot to a stream of messages
    this.gitBot = this.controller.spawn({
      token: this.GITBOT_SLACK_TOKEN,
      incoming_webhook: {
        configuration_url: this.GITBOT_WEBSERVER_HOOK_URL,
        url: this.GITBOT_WEBSERVER_HOOK_URL
      }
    }).startRTM((err) => {
      if (err) { throw new Error(`Could not connect to Slack due to: ${err}`); }
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
        const user = res.user;
        user.slackId = user.id;
        user.id = githubUsername;

        this.controller.storage.users.save(user, cb);
        bot.reply(message, answer);
      });
    });
  }

  setUpWebserver (port) {
    const app = express();
    app.use(bodyParser.json());

    app.get('/gitbot/v1/platform/ping', this.ping);
    app.post('/gitbot/v1/event', this.extractGithubData, this.handleGithubEvent.bind(this));

    app.listen(port, () => {
      console.log(`Gitbot listening on port ${port}`);
    });
  }

  ping (req, res) {
    return res.sendStatus(200);
  }

  handleGithubEvent (req, res) {
    const data = req.data;
    if(!data) return res.send('ok');

    const prDisplayableText = `<${req.prUrl}|[${req.prRepositoryName}] ${req.prTitle}>`;
    let text = `An error occured, please forward to aa@alkemics.com. ${JSON.stringify(data)}`;
    let recipient = {};

    // Valid types: `commit_comment`, `pull_request`, `pull_request_review_comment`
    if (req.githubEventType === `pull_request` && (['assigned', 'opened', 'reopened'].indexOf(data.action) > -1)) {
      text = `A PR ${prDisplayableText} has been assigned to you by ${req.prSender}`;
      recipient = req.prAssignee;
    } else if (['pull_request_review_comment', 'commit_comment'].indexOf(req.githubEventType) > -1) {
      text = `The PR ${prDisplayableText} has been commented by ${req.prCommenter}`;

      if (req.prAssignee !== req.prCommenter) {
        recipient = req.prAssignee;
      }
    } else if (req.githubEventType === `pull_request_review`) {
      text = `${req.reviewer} has ${req.reviewState} your PR ${req.prTitle}`;
      recipient = req.prOpener;
    } else {
      recipient = 'adlenafane';
    }

    res.send('ok');

    this.controller.storage.users.get(recipient, (redisErr, redisUser) => {
      if (redisErr) {
        res.status(500).send(redisErr);
        return;
      }

      const user = redisUser || {};
      this.say(user, text, cb);
    });
  }

  extractGithubData (req, res, next) {
    const payload = typeof req.body.payload === 'string' ?
      JSON.parse(req.body.payload) : req.body.payload;
    const data = payload || req.body;
    req.data = data;
    req.githubEventType = req.get('X-GitHub-Event');

    if (data.pull_request) {
      req.prTitle = data.pull_request.title;
      req.prUrl = data.pull_request.html_url;
      req.prOpener = data.pull_request.user.login;

      req.prAssignee = data.pull_request.assignee ? data.pull_request.assignee.login : undefined;
      req.prAssignees = data.pull_request.assignees ? data.pull_request.assignees.map(a => a.login) : undefined;
    }
    if (data.review) {
      req.reviewer = data.review.user ? data.review.user.login : '';
      req.reviewState = data.review.state;
    }
    req.prRepositoryName = data.repository ? data.repository.name : undefined;
    req.prCommenter = data.comment ? data.comment.user.login : undefined;
    req.prSender = data.sender ? data.sender.login : undefined;

    next();
  }

  say (user, text, next) {
    this.gitBot.sendWebhook({
      text: text,
      channel: user.slackId,
      user: user.slackId,
      username: this.GITBOT_USERNAME,
      icon_url: this.GITBOT_ICON_URL
    }, next);
  }
}

export default GitBot;
