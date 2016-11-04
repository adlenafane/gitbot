import path from 'path';
import { expect } from 'chai';
import Gitbot from '../src/gitbot/index.js';

import pullRequestOpened from './githubPayload/pull_request_opened';
import pullRequestReview from './githubPayload/pull_request_review';

describe(path.relative(process.cwd(), __filename), () => {
  let gitbot;

  beforeEach(() => {
    gitbot = new Gitbot();
  });

  it('should gracefully handle an empty body', (done) => {
    const req = {
      get: () => {},
      body: {}
    };
    const res = {};
    const next = () => {
      expect(req.data).to.eql({});
      expect(req.githubEventType).to.be.null;
      done();
    };

    gitbot.extractGithubData(req, res, next);
  });

  it('should correctly parse PR opening', (done) => {
    const req = {
      get: () => {},
      body: { payload: pullRequestOpened }
    };
    const res = {};
    const next = () => {
      expect(req.data).to.be.an.object;

      expect(req.prTitle).to.equal('Update the README with new information');
      expect(req.prUrl).to.equal('https://github.com/baxterthehacker/public-repo/pull/1');
      expect(req.prOpener).to.equal('baxterthehacker');
      expect(req.prAssignee).to.be.null;
      expect(req.prAssignees).to.be.undefined;
      expect(req.prRepositoryName).to.equal('public-repo');
      expect(req.prCommenter).to.be.undefined;
      expect(req.prSender).to.equal('baxterthehacker');
      expect(req.reviewer).to.be.undefined;
      expect(req.reviewState).to.be.undefined;

      done();
    };

    gitbot.extractGithubData(req, res, next);
  });

  it('should correctly parse PR review', (done) => {
    const req = {
      get: () => {},
      body: { payload: pullRequestReview }
    };
    const res = {};
    const next = () => {
      expect(req.data).to.be.an.object;

      expect(req.prTitle).to.equal('Add a README description');
      expect(req.prUrl).to.equal('https://github.com/baxterthehacker/public-repo/pull/8');
      expect(req.prOpener).to.equal('skalnik');
      expect(req.prAssignee).to.equal('adlenafane');
      expect(req.prAssignees).to.have.lengthOf(3);
      expect(req.prAssignees).to.contains('adlenafane');
      expect(req.prAssignees).to.contains('gpajot');
      expect(req.prAssignees).to.contains('bejito');
      expect(req.prRepositoryName).to.equal('public-repo');
      expect(req.prCommenter).to.be.undefined;
      expect(req.prSender).to.equal('baxterthehacker');
      expect(req.reviewer).to.be.undefined;
      expect(req.reviewState).to.be.undefined;

      done();
    };

    gitbot.extractGithubData(req, res, next);
  });
});
