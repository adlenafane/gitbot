import Gitbot from './gitbot';
import Storage from './gitbot/storage/redis';

const configuration = {
  debug: false,
  storage: new Storage({namespace: 'gitbot:storage'})
}

const gitbot = new Gitbot(configuration);
