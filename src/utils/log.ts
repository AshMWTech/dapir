import chalk from 'chalk';

const log = (severity: 'info'|'debug'|'error'|'ready'|'raw', message: string) => {
  if (severity == 'ready') return console.log(`[${new Date().toISOString()}] `+chalk.green(message));
  if (severity == 'error') return console.log(`[${new Date().toISOString()}] `+chalk.red(message));
  if (severity == 'debug') return console.log(`[${new Date().toISOString()}] `+chalk.blue(message));
  if (severity == 'info') return console.log(`[${new Date().toISOString()}] `+chalk.yellow(message));
  if (severity == 'raw') return console.log(message);
};

export default log;