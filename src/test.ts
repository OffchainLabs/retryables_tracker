import yargs from 'yargs/yargs';

const argv = yargs(process.argv.slice(2))
  .options({
    action: {
      type: 'string',
    }
  })
  .demandOption('action')
  .parseSync();

console.log(argv.action)

const a = yargs(process.argv.slice(2))
  .options({
    action: {
      type: 'string',
    }
  })
  .demandOption('action')
  .parseSync();

  console.log(a.action)