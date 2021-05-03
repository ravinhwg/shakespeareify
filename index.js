require('dotenv').config()
const Twit = require('twit')
const translate = require('./worker')
const USERNAME = '@shakespeareify'
const USER_ID = '1388734131345891328'
const T = new Twit({
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token: process.env.access_token,
    access_token_secret: process.env.access_token_secret
})
const stream = T.stream("statuses/filter", { track: USERNAME });

stream.on('tweet', grabMention);

async function grabMention(tweet) {
    // Check if the bot is mentioned inside the tweet text. Or don't do anything
    console.log(!(tweet.in_reply_to_user_id_str === USER_ID))
    console.log(await checkTheTweetAboveThisTweet(tweet.in_reply_to_status_id_str))
    if (!(tweet.in_reply_to_user_id_str === USER_ID) && await checkTheTweetAboveThisTweet(tweet.in_reply_to_status_id_str)) {
        // Check if the tweet the bot is mentioned is a reply tweet
        const isReply = tweet.in_reply_to_status_id_str !== null;
        if (isReply) {
            // Load the tweet above the mentioned tweet,
            T.get('statuses/show', { id: tweet.in_reply_to_status_id_str }, (err, data, response) => {
                // Chek if the tweet is in English if not reject and Post saying the bot cannot handle it
                if (data.lang === 'en') {
                    mutateTweet(data, tweet)
                } else {
                    // Say that the tweet is not written in English!
                    T.post('statuses/update', {
                        status: `Oh! @${tweet.user.screen_name}, looks like thy tweet is not writ in English `,
                        in_reply_to_status_id: tweet.id_str
                    })
                }
            })

        } else {
            // Tell the user to not to bother me by tagging me on main tweets
            T.post('statuses/update', {
                status: `Valorous morrow to thee, @${tweet.user.screen_name}! Thither is nothing up thither. Calleth me in a thread.`,
                in_reply_to_status_id: tweet.id_str
            })
        }
    }else{
        console.log('Ignore. Replying to myself')
    }
}

function mutateTweet(data, tweet) {
    console.log('Original tweet: ' + data.text)
    // Loop thought the incoming tweet only send it to the translator if the value is not a url
   const URL_REGEX = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm
   const tweetWordsArray = JSON.parse(JSON.stringify(data)).text.split(' ')

   tweetWordsArray.forEach((item, index) => {
       if(!URL_REGEX.test(item) && !item.includes('@')){
           // Word is not a url and not a twitter handle
           tweetWordsArray[index] = translate(item)
       }
   })
   const finalText = tweetWordsArray.join(' ')
    console.log('Reply before sending: ' + finalText)
    console.log('Reply char length: ' + finalText.length)
    T.post('statuses/update', {
        status: `@${tweet.user.screen_name} ${finalText}`,
        in_reply_to_status_id: tweet.id_str
    }, (err, data, response) => {
        console.log('Reply: ' + data.text)
    })
}

// Check if the tweet above this tweet has the bot mentioned
function checkTheTweetAboveThisTweet(tweet_id_str){
    const promise = new Promise((resolve, reject) => {
        T.get('statuses/show', {
            id: tweet_id_str
        }, (err, data, response) => {
            if(data.text.includes(USERNAME)){
                resolve(false)
            }else{
                resolve(true)
            }
        })
    })
    return promise
}