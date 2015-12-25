import Gitbot from './src/gitbot';
import Storage from './src/gitbot/storage/redis';

const configuration = {
  debug: false,
  storage: new Storage({namespace: 'gitbot:storage'})
}

const gitbot = new Gitbot(configuration);
