import path from 'path';
import { expect } from 'chai';
import sinon from 'sinon';
import Gitbot from './index.js';

describe(path.relative(process.cwd(), __filename), () => {
  let gitbot;

  beforeEach(() => {
    gitbot = new Gitbot();
  });

  it('should have a bot with basic properties', () => {
    console.log(gitbot.extractGithubData);
    expect(gitbot.constructor).to.be.a.function;
    expect(gitbot.gitbot).to.be.an.object;
    expect(gitbot.extractGithubData).to.be.a.function;
    expect(gitbot.handleGithubEvent).to.be.a.function;
    expect(gitbot.ping).to.be.a.function;
    expect(gitbot.say).to.be.a.function;
  });

  it('should correctly set up on init', () => {
    gitbot.setUp = sinon.spy();
    gitbot.setUpWebServer = sinon.spy();
    gitbot.constructor();

    expect(gitbot.setUp.calledOnce).to.be.true();
    expect(gitbot.setUpWebServer.calledOnce).to.be.true();
  });
});
