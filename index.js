#!/usr/bin/env node
const { exec, execSync } = require('child_process');
const colors = require('colors');
const { log, clear } = require('console');
const readlineSync = require('readline-sync');
const readline = require('readline');
const prompt = require('prompt-sync')();

let message = '';
const choices = [
  {
    name: 'build: Changes that affect the build system or external dependencies',
    value: 'build',
  },
  {
    name: 'ci: Changes to our CI configuration files and scripts',
    value: 'ci',
  },
  {
    name: 'chore: Update tasks that do not cause code changes',
    value: 'chore',
  },
  { name: 'docs: Documentation only changes', value: 'docs' },
  { name: 'feat: A new feature', value: 'feat' },
  { name: 'fix: A bug fix', value: 'fix' },
  {
    name: 'improvement: Improves a current implementation without adding a new feature or fixing a bug',
    value: 'improvement',
  },
  { name: 'perf: A code change that improves performance', value: 'perf' },
  {
    name: 'refactor: A code change that neither fixes a bug nor adds a feature',
    value: 'refactor',
  },
  { name: 'revert: Reverts a previous commit', value: 'revert' },
  {
    name: 'style: Changes that do not affect the meaning of the code',
    value: 'style',
  },
  {
    name: 'test: Adding missing tests or correcting existing tests',
    value: 'test',
  },
  { name: "other: Doesn't fit any of the suggested types?", value: 'other' },
];

const listFilesCommand = process.platform === "win32" ? "dir" : "ls -a";

const sleep = (milliseconds) => {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
};

handleGitIgnoreFile = () => {
  exec(`touch .gitignore`, (error, stdout, stderr) => {
    if (error) {
      return;
    }
  });
  exec(`echo "node_modules/" >> .gitignore`, (error, stdout, stderr) => {
    if (error) {
      return;
    }
    log('\n Created .gitignore file'.yellow.bold);
  });
};

const isGitRepo = execSync(listFilesCommand, {
  encoding: 'utf-8',
}).includes('.git');


if (!isGitRepo) {
  log('No git repository found'.red.bold);
  sleep(200);
  log('Initializing git repository'.yellow.bold);
  sleep(200);
  exec(`git init`, (error, stdout, stderr) => {
    if (error) {
      log('Something went wrong. Please try again.'.red);
      return;
    }
    log('\n Initialized git repository'.yellow.bold);
  });
}

const flag = execSync(listFilesCommand, { encoding: 'utf-8' }).includes('.gitignore');

if (!flag) {
  log('No .gitignore file found'.red.bold);
  sleep(200);
  log('Creating .gitignore file'.yellow.bold);
  sleep(200);
  log('Adding node_modules/ to .gitignore'.yellow.bold);
  sleep(200);
  readlineSync.question('Press enter to continue...'.yellow.bold);
  handleGitIgnoreFile();
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let selectedIndex = 0;

const displayChoices = () => {
  clear();
  log('Select the type of commit you want to make:'.inverse);
  log('Use arrow keys to navigate. Press enter to select.'.inverse);
  choices.forEach((c, idx) => {
    if (idx === selectedIndex) {
      console.log(
        colors.bgYellow.bold.green(`
      > ${idx + 1}. ${c.name}  `)
      );
    }
  });
}


displayChoices();

const handleUnStagedFiles = (files) => {
  execSync(`git add .`)
  execSync(`git commit -m "${message}"`)
  log(`Commit successful`.green.bold);

};
const commit = () => {
  exec(`git commit -m "${message}"`, (error, stdout, stderr) => {
    if (error) {
      if (error.code === 1) {
        log('You have un staged files.'.red);
        let color = execSync('git status --porcelain', { encoding: 'utf-8' });
        color = color.split(' ');
        color = color.map((c) => c.replace('M', ' M '.white.bgYellow.bold));
        color = color.map((c) => c.replace('??', ' ?? '.white.bgRed.bold));
        color = color.map((c) => c.replace('A', ' A '.white.bgGreen.bold));
        color = color.map((c) => c.replace('D', ' D '.white.bgRed.bold));
        color = color.map((c) => c.replace('R', ' R '.white.bgBlue.bold));

        log(color.join(' '));
        log(` Would you like to add them? (y/n)`.red);

        const answer = readlineSync.question('y/n: ', {
          limit: ['y', 'n'],
          limitMessage: 'Please enter y or n',
          hideEchoBack: false,
        });
        if (answer === 'y') {
          handleUnStagedFiles();
        } else {
          log('Exiting...'.red);
          log('Please stage your files and try again.'.red);
          log('use: git add <file-name>'.red);
          process.exit(0);
        }
      }
    }
    else log(`Commit successful`.green.bold);

    rl.close();
  });

}
rl.input.on('keypress', (_, key) => {
  if (key.name === 'up') {
    selectedIndex = Math.max(selectedIndex - 1, 0);
    displayChoices();
  } else if (key.name === 'down') {
    selectedIndex = Math.min(selectedIndex + 1, choices.length - 1);
    displayChoices();
  } else if (key.name === 'return') {
    const choice = choices[selectedIndex];
    console.log(`You selected: ${choice.name}`);
    message += choice.value;
    const scope = prompt('Enter the scope of the work you done: ');
    message += `(${scope}): `;
    const description = prompt('Enter a description of the work you done: ');
    message += `${description}`;
    const issueNumber = prompt('Enter the issue number: ');
    message += ` Relates #${issueNumber}`;
    if (readlineSync.keyInYN('Do you want to close the issue?')) {
      message += `
Closes #${issueNumber}`;
    }
    log(`\n Your commit message is:  `.yellow + `${message}`.green);

    if (readlineSync.keyInYN('Do you want to commit?')) {
      commit();
    }


  }
});
