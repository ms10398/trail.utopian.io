const steem = require('steem');
const config = require('./config')
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const labels = config.labels;
const following = config.following;

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
        var i;
        for (i = 0; i < following.length; i++) {
            const followed = following[i];

            if (data.voter == followed.account) {
                console.log(data);
                weight = data.weight * followed.weight_divider;
                weight = weight > followed.max_weight ? followed.max_weight : weight;
                let comment = followed.comment.replace('{AUTHOR}', data.author).replace('{VOTER}', data.voter)
                setTimeout(function() {
                    StreamVote(data.author, data.permlink, weight, comment, followed.check_context)
                },30000);
                console.log('@' + data.voter + ' Just voted now!');
            }
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
