import Gitbot from './gitbot';
import Storage from './gitbot/storage/redis';

const configuration = {
  debug: false,
  storage: new Storage({
    host: process.env.REDIS_1_PORT_6379_TCP_ADDR,
    port: process.env.REDIS_1_PORT_6379_TCP_PORT,
    namespace: 'gitbot:storage'
  })
}

const gitbot = new Gitbot(configuration);
