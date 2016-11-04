import path from 'path';
import sinon from 'sinon';
import { expect } from 'chai';
import Gitbot from '../src/gitbot/index.js';

describe(path.relative(process.cwd(), __filename), () => {
  let gitbot;

  beforeEach(() => {
    gitbot = new Gitbot();
  });

  it('should gracefully handle an empty data', (done) => {
    const req = {
      get: () => {},
      body: {}
    };
    const res = {
      send: sinon.spy()
    };

    gitbot.controller.storage.users.get = sinon.spy();
    gitbot.handleGithubEvent(req, res);
    expect(gitbot.controller.storage.users.get.calledOnce).to.be.true();
    expect(res.send.calledOnce).to.be.true();
  });
});
