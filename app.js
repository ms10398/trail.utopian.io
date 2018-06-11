const steem = require('steem');
const config = require('./config')
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const labels = config.labels;
const following = config.following;

steem.api.setOptions({ url: 'http://rpc.buildteam.io/' });

const nlu = new NaturalLanguageUnderstandingV1({
    username: config.username,
    password: config.password,
    version: '2018-04-05',
    url: config.url
});

const ACC_NAME = config.accname,
    ACC_KEY = config.posting;
console.log("Curation Trail Bot Script Running...");

steem.api.streamTransactions('head', function(err, result) {
    if (!err) {
        try {
            const type = result.operations[0][0];
            const data = result.operations[0][1];
            let weight = 0;

            if (type === 'vote' && data.voter !== data.author) {
                var i;
                for (i = 0; i < following.length; i++) {
                    const followed = following[i];

                    if (data.voter == followed.account) {
                        console.log(data);
                        weight = Math.round(data.weight * followed.weight_divider);
                        weight = weight > followed.max_weight ? followed.max_weight : weight;
                        var comment = followed.comment.replace('{AUTHOR}', data.author).replace('{VOTER}', data.voter)
                        setTimeout(function() {
                            StreamVote(data.author, data.permlink, weight, comment, followed.check_context)
                        }, 45000 * i);
                        console.log('@' + data.voter + ' Just voted now!');
                    }
                }
            }
        }catch(e) {
            console.log(e)
        }
    }

    if (err) console.log(err);
});

function StreamVote(author, permalink, weight, comment, check_context) {
    try {
        steem.api.getContent(author, permalink, function(err, result) {
            if (!err) {
                var hasVoted = false;

                if (weight !== 0) {
                    var v;
                    for(v = 0; v < result.active_votes.length; v++) {
                        const activeVote = result.active_votes[v];

                        if (activeVote.voter === 'utopian-io') {
                            hasVoted = true;
                        }
                    }
                }
               
                console.log(hasVoted);

                if (!hasVoted && JSON.parse(result.json_metadata).tags[0] !== 'utopian-io' && result.depth === 0) {
                    if(weight == 0)
                    {
                      applyVote(ACC_KEY, ACC_NAME, author, permalink, weight, comment);
                    }
                    else {
                    if (check_context === true) {
                        try {
                            nlu.analyze({
                                    text: result.body,
                                    features: {
                                        categories: {}
                                    }
                                },
                                function(err, response) {
                                    if (err) {
                                        console.log('error:', err);
                                    }

                                    if (!err && response) {
                                        console.log(response);
                                        var vote = false;
                                        console.log('First check for labels');
                                        var c;
                                        for(c = 0; c < response.categories.length; c++) {
                                            const category = response.categories[c];

                                            if (labels.includes(category.label) === true && category.score >= 0.55) {
                                                vote = true;
                                            }
                                        }
                                        console.log(vote);

                                        if (vote === true) {
                                            applyVote(ACC_KEY, ACC_NAME, author, permalink, weight, comment);
                                        }
                                    }
                                })
                        }catch(e) {
                            console.log(e)
                        }
                    }

                    if (check_context === false) {
                        applyVote(ACC_KEY, ACC_NAME, author, permalink, weight, comment);
                    }
                    }
                }
            }

            if (err) console.log(err);
        })
    }catch(e) {
        console.log(e)
    }
}

function applyVote (ACC_KEY, ACC_NAME, author, permalink, weight, comment) {
    try {
        steem.broadcast.vote(ACC_KEY, ACC_NAME, author, permalink, weight, function(err, result) {
            if (err) {
                console.log(err);
            }
            if (!err && result) {
                console.log('Voted Succesfully, permalink: ' + permalink + ', author: ' + author + ', weight: ' + weight / 100 + '%.');

                const newpermlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();

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
    }catch(e){
        console.log(e);
    }
}
