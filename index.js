require('dotenv').config();
const snoowrap = require('snoowrap');
const randomWords = require('random-words');

// Create Reddit API client
const reddit = new snoowrap({
  userAgent: process.env.USER_AGENT,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD
});

// Delay function to avoid rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Generate random content
const generateRandomContent = () => {
  return randomWords({ min: 10, max: 50, join: ' ' });
};

// Process submissions (posts)
async function processSubmissions() {
  console.log('Fetching user submissions...');
  
  const submissions = await reddit.getMe().getSubmissions();
  console.log(`Found ${submissions.length} submissions to process.`);
  
  for (let i = 0; i < submissions.length; i++) {
    const submission = submissions[i];
    const randomContent = generateRandomContent();
    
    console.log(`[${i+1}/${submissions.length}] Processing submission: ${submission.title}`);
    
    try {
      // Edit the submission if it's a self post (text post)
      if (submission.is_self) {
        console.log('Editing submission content...');
        await submission.edit(randomContent);
        console.log('Successfully edited submission.');
      }
      
      // Delete the submission
      console.log('Deleting submission...');
      await submission.delete();
      console.log('Successfully deleted submission.');
      
      // Delay to avoid rate limiting
      await delay(2000);
    } catch (error) {
      console.error(`Error processing submission: ${error.message}`);
    }
  }
}

// Process comments
async function processComments() {
  console.log('Fetching user comments...');
  
  const comments = await reddit.getMe().getComments();
  console.log(`Found ${comments.length} comments to process.`);
  
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    const randomContent = generateRandomContent();
    
    console.log(`[${i+1}/${comments.length}] Processing comment on: ${comment.link_title}`);
    
    try {
      // Edit the comment
      console.log('Editing comment content...');
      await comment.edit(randomContent);
      console.log('Successfully edited comment.');
      
      // Delete the comment
      console.log('Deleting comment...');
      await comment.delete();
      console.log('Successfully deleted comment.');
      
      // Delay to avoid rate limiting
      await delay(2000);
    } catch (error) {
      console.error(`Error processing comment: ${error.message}`);
    }
  }
}

// Main function
async function main() {
  try {
    console.log('Starting Reddit Nuke...');
    await processSubmissions();
    await processComments();
    console.log('Reddit Nuke completed successfully!');
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
  }
}

// Run the program
main();