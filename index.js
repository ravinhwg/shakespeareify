require('dotenv').config()
const Twit =  require('twit')
const wordList =  require('./wordList.js')
const T = new Twit({
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token: process.env.access_token,
    access_token_secret: process.env.access_token_secret
})
const stream = T.stream("statuses/filter",{track: '@shakespeareify'});

stream.on('tweet', grabMention);

function grabMention(tweet){
    // Check if the tweet the bot is mentioned is a reply tweet
    const isReply = tweet.in_reply_to_status_id_str !== null;
    if(isReply){
     // Load the tweet above the mentioned tweet,
     T.get('statuses/show', {id: tweet.in_reply_to_status_id_str}, (err, data, response) => {
         // Chek if the tweet is in English if not reject and Post saying the bot cannot handle it
         if(data.lang === 'en'){
            mutateTweet(data, tweet)
         }else{
            // Say that the tweet is not written in English!
            T.post('statuses/update', {
                status: `Oh! @${tweet.user.screen_name}, looks like thy tweet is not writ in English `,
                in_reply_to_status_id: tweet.id_str
            })
         }
     })

    }else{
    // Tell the user to not to bother me by tagging me on main tweets
        T.post('statuses/update', {
            status: `Valorous morrow to thee, @${tweet.user.screen_name}! Thither is nothing up thither. Calleth me in a thread.`,
            in_reply_to_status_id: tweet.id_str
        })
    }
}

function mutateTweet(data, tweet){
    // Mutating the tweet into archiac english here.
    const tweetToMutate = JSON.parse(JSON.stringify(data)).text
    const mutateArray = tweetToMutate.split(' ')
    // Now loop throught the array for the first time and eplace the words
    mutateArray.forEach((item, index) => {
        // for each word. Go throught the wordlist
        wordList.forEach((listWord, listIndex) => {
            if(item.toUpperCase() === listWord.modern_word.toUpperCase()){
                mutateArray[index] = listWord.old_word
            }
        })
    })
    // Convert it to a string
    const finalTweet = mutateArray.join(' ')
    T.post('statuses/update', {
        status: `@${tweet.user.screen_name} ${finalTweet}`,
        in_reply_to_status_id: tweet.id_str
    }, (err, data, response) => {
        console.log(data)
    })
}