const steem = require('steem');
const config = require('./config')
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

const labels = [
  '/science/biology/biotechnology',
  '/science/biology/botany',
  '/science/biology/breeding',
  '/science/biology/cytology',
  '/science/biology/marine biology',
  '/science/biology/molecular biology',
  '/science/biology/zoology/endangered species',
  '/science/biology/zoology/entomology',
  '/science/biology/zoology/ornithology',
  '/science/biology/zoology',
  '/science/chemistry/organic chemistry',
  '/science/chemistry',
  '/science/computer science/artificial intelligence',
  '/science/computer science/cryptography',
  '/science/computer science/distributed systems',
  '/science/computer science/information science',
  '/science/computer science/software engineering',
  '/science/computer science',
  '/science/ecology/environmental disaster',
  '/science/ecology/pollution',
  '/science/ecology/waste management/recycling',
  '/science/ecology/waste management/waste disposal',
  '/science/ecology',
  '/science/engineering',
  '/science/geography/cartography',
  '/science/geography/topography',
  '/science/geography',
  '/science/geology/mineralogy',
  '/science/geology/seismology/earthquakes',
  '/science/geology/volcanology/volcanic eruptions',
  '/science/geology',
  '/science/mathematics/algebra',
  '/science/mathematics/arithmetic',
  '/science/mathematics/geometry',
  '/science/mathematics/statistics',
  '/science/mathematics',
  '/science/medicine/cardiology',
  '/science/medicine/dermatology',
  '/science/medicine/embryology',
  '/science/medicine/genetics',
  '/science/medicine/immunology',
  '/science/medicine/medical research',
  '/science/medicine/oncology',
  '/science/medicine/orthopedics',
  '/science/medicine/pediatrics',
  '/science/medicine/pharmacology',
  '/science/medicine/physiology',
  '/science/medicine/psychology and psychiatry/psychoanalysis',
  '/science/medicine/psychology and psychiatry',
  '/science/medicine/surgery/cosmetic surgery',
  '/science/medicine/surgery/transplants',
  '/science/medicine/surgery',
  '/science/medicine/veterinary medicine',
  '/science/medicine',
  '/science/physics/atomic physics',
  '/science/physics/astrophysics',
  '/science/physics/electromagnetism',
  '/science/physics/hydraulics',
  '/science/physics/nanotechnology',
  '/science/physics/optics',
  '/science/physics/space and astronomy',
  '/science/physics/thermodynamics',
  '/science/physics',
  '/business and industrial/aerospace and defense/space technology',
  '/business and industrial/automation/robotics',
  '/business and industrial/business software',
  '/business and industrial/energy/electricity',
  '/hobbies and interests/inventors and patents',
  '/science',
  '/technology and computing/computer security/antivirus and malware',
  '/technology and computing/computer security/network security',
  '/technology and computing/computer security',
  '/technology and computing/data centers',
  '/technology and computing/electronic components',
  '/technology and computing/enterprise technology/data management',
  '/technology and computing/enterprise technology/enterprise resource planning',
  '/technology and computing/hardware/computer/servers',
  '/technology and computing/hardware/computer components/chips and processors',
  '/technology and computing/hardware/computer/components/disks',
  '/technology and computing/hardware/computer/components/graphics cards',
  '/technology and computing/hardware/computer/components/memory/portable',
  '/technology and computing/hardware/computer/components/memory',
  '/technology and computing/hardware/computer/components/motherboards',
  '/technology and computing/hardware/computer/networking/wireless technology',
  '/technology and computing/hardware',
  '/technology and computing/internet technology/isps',
  '/technology and computing/internet technology/social network',
  '/technology and computing/internet technology/web design and html',
  '/technology and computing/internet technology/web search/people search',
  '/technology and computing/internet technology/web search',
  '/technology and computing/internet technology',
  '/technology and computing/networking/network monitoring and management',
  '/technology and computing/networking/vpn and remote access',
  '/technology and computing/networking',
  '/technology and computing/operating systems/linux',
  '/technology and computing/operating systems/mac os',
  '/technology and computing/operating systems/unix',
  '/technology and computing/operating systems/windows',
  '/technology and computing/operating systems',
  '/technology and computing/programming languages/c and c++',
  '/technology and computing/programming languages/java',
  '/technology and computing/programming languages/javascript',
  '/technology and computing/programming languages/visual basic',
  '/technology and computing/programming languages',
  '/technology and computing/software/databases',
  '/technology and computing/software/desktop publishing',
  '/technology and computing/software/desktop video',
  '/technology and computing/software/graphics software/animation',
  '/technology and computing/software/graphics software',
  '/technology and computing/software/net conferencing',
  '/technology and computing/software/shareware and freeware',
  '/technology and computing/technological innovation'
]

const nlu = new NaturalLanguageUnderstandingV1({
  username: config.username,
  password: config.password,
  version: '2018-04-05',
  url: config.url
});

const ACC_NAME = config.accname,
  ACC_KEY = config.posting;
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
      setTimeout(function() {
        StreamVote(data.author, data.permlink, weight, comment)
      },30000);
      console.log('@' + data.voter + ' Just voted now!');
    }
    if (data.voter == 'steemmakers') {
      console.log(data);
      weight = data.weight * 0.05;
      weight = weight > 5000 ? 5000 : weight;
      let comment = `#### Hi @${data.author}!\n\nYour post was upvoted by utopian.io in cooperation with ${data.voter} - supporting knowledge, innovation and technological advancement on the Steem Blockchain.\n\n#### Contribute to Open Source with utopian.io\nLearn how to contribute on <a href="https://join.utopian.io">our website</a> and join the new open source economy.\n\n**Want to chat? Join the Utopian Community on Discord https://discord.gg/h52nFrV**`
      setTimeout(function() {
        StreamVote(data.author, data.permlink, weight, comment, true)
      },30000);
      console.log('@' + data.voter + ' Just voted now!');
    }
  }
});

function StreamVote(author, permalink, weight, comment, check_context = false) {
  steem.api.getContent(author, permalink, function(err, result) {
    if (JSON.parse(result.json_metadata).tags[0] != 'utopian-io') {
      if (check_context) {
        nlu.analyze({
            text: result.body,
            features: {
              categories: {}
            }
          },
          function(err, response) {
            if (err) {
              console.log('error:', err);
            } else {
              console.log(response);
              let vote = false;
              console.log('First check for labels');
              console.log(response.categories[0].label);
              for (cat in labels) {
                console.log(labels[cat]);
                if (response.categories[0].label == labels[cat]) {
                  vote = true;
                  console.log(vote);
                  break;
                }
              }
              if (vote == false) {
                if (response.categories[1].score > 0.5) {
                  console.log('Second check for labels');
                  for (cat in labels) {
                    if (response.categories[1].label == labels[cat]) {
                      vote = true;
                      break;
                    }
                  }
                }
              }
              console.log(vote);
              if (vote == true) {
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
                console.log('Post is not eligible to get upvote. It is unrelated.');
              }
            }
          })
      } else {
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
      }
    } else {
      console.log('Post is already voted by Utopian-io');
    }
  })
  return true;
}
