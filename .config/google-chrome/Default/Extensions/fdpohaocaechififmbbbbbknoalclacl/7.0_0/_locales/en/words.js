const { readFileSync } = require('fs');

const content = readFileSync('./messages.json', 'utf8');
const data = JSON.parse(content);

const count = Object.values(data).reduce((numWords, { message }) => {
  const words = message.split(/\s+/).length;
  console.log('FOUND WORDS', words);
  return numWords + words;
}, 0);

console.log('COUNT', count);
