let steem = require('steem');

const ACC_NAME = '',
  ACC_KEY = '';
console.log("Curation Trail Bot Script Running...");
console.log("Waiting for votes from steemstem, steemmakers");

steem.api.streamTransactions('head', function(err, result) {
  const type = result.operations[0][0];
  const data = result.operations[0][1];
  let weight = 0;
  if (type == 'vote') {
    if (data.voter == 'steemstem') {
      console.log(data);
      weight = data.weight * 0.15;
      weight = weight > 15000 ? 15000 : weight;
      let comment = `#### Hi @${data.author}!\n\nYour post was upvoted by utopian.io in cooperation with ${data.voter} - supporting knowledge, innovation and technological advancement on the Steem Blockchain.\n\n#### Contribute to Open Source with utopian.io\nLearn how to contribute on <a href="https://join.utopian.io">our website</a> and join the new open source economy.\n\n**Want to chat? Join the Utopian Community on Discord https://discord.gg/h52nFrV**`
      StreamVote(data.author, data.permlink, weight, comment);
      console.log('@' + data.voter + ' Just voted now!');
    }
    if (data.voter == 'steemmakers') {
      console.log(data);
      weight = data.weight * 0.05;
      weight = weight > 5000 ? 5000 : weight;
      let comment = `#### Hi @${data.author}!\n\nYour post was upvoted by utopian.io in cooperation with ${data.voter} - supporting knowledge, innovation and technological advancement on the Steem Blockchain.\n\n#### Contribute to Open Source with utopian.io\nLearn how to contribute on <a href="https://join.utopian.io">our website</a> and join the new open source economy.\n\n**Want to chat? Join the Utopian Community on Discord https://discord.gg/h52nFrV**`
      StreamVote(data.author, data.permlink, weight, comment);
      console.log('@' + data.voter + ' Just voted now!');
    }
  }
});

function StreamVote(author, permalink, weight, comment) {
  steem.api.getContent(author, permalink, function(err, result) {
    if (JSON.parse(result.json_metadata).tags[0] != 'utopian-io') {
      steem.broadcast.vote(ACC_KEY, ACC_NAME, author, permalink, weight, function(err, result) {
        if (err)
          console.log(err);
        else {
          console.log('Voted Succesfully, permalink: ' + permalink + ', author: ' + author + ', weight: ' + weight / 100 + '%.');
          let newpermlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
          steem.broadcast.comment(ACC_KEY, author, permalink, ACC_NAME, newpermlink, '', comment, {
            tags: ['utopian.tip'],
            app: 'utopian-io'
          }, function(err, result) {
            if (err) {
              console.log(err);
            } else {
              console.log('Commented on the post');
            }
          });
        }
      });
    } else {
      console.log('Post is already voted by Utopian-io');
    }
  })
}
