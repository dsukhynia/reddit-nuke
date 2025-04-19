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

// Function to truncate text to a specific word count
function truncateToWords(text, wordCount) {
  const words = text.split(/\s+/);
  if (words.length <= wordCount) {
    return text;
  }
  return words.slice(0, wordCount).join(' ') + '...';
};

// Process submissions (posts) in batches
async function processSubmissions() {
  console.log('\n🔄 PROCESSING USER SUBMISSIONS IN BATCHES...');
  
  let processed = 0;
  let after = null;
  const batchSize = 25; // Process 25 submissions at a time
  
  // Helper for visual separators
  const separator = "=".repeat(80);
  const smallSeparator = "-".repeat(40);
  
  while (true) {
    console.log(`\n${separator}`);
    console.log(`📥 FETCHING BATCH OF SUBMISSIONS (after: ${after || 'start'})`);
    console.log(separator);
    
    // Get a batch of submissions
    const submissionsListing = await reddit.getMe().getSubmissions({
      limit: batchSize,
      after: after
    });
    
    const submissions = await submissionsListing;
    if (submissions.length === 0) {
      console.log('\n❌ No more submissions to process.');
      break;
    }
    
    console.log(`📋 Found ${submissions.length} submissions in this batch.\n`);
    
    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      const randomContent = generateRandomContent();
      processed++;
      
      console.log(smallSeparator);
      console.log(`🔄 [${processed}] Processing submission: ${submission.title}`);
      
      try {
        // Edit the submission if it's a self post (text post)
        if (submission.is_self) {
          const originalContent = truncateToWords(submission.selftext || "[No content]", 30);
          console.log(`📝 ORIGINAL: "${originalContent}"`);
          console.log(`🔀 REPLACING WITH: "${randomContent}"`);
          
          console.log('📝 Editing submission content...');
          await submission.edit(randomContent);
          console.log('✅ Successfully edited submission.');
        }
        
        // Delete the submission
        console.log('🗑️  Deleting submission...');
        await submission.delete();
        console.log('✅ Successfully deleted submission.');
        
        // Delay to avoid rate limiting
        await delay(2000);
      } catch (error) {
        console.error(`❌ Error processing submission: ${error.message}`);
      }
    }
    
    // Save the fullname of the last item for pagination
    after = submissions.length > 0 ? submissions[submissions.length - 1].name : null;
    
    // If we got fewer than the requested batch size, we've reached the end
    if (submissions.length < batchSize) {
      console.log('\n❌ No more submissions to process.');
      break;
    }
    
    console.log(`\n📊 Processed ${processed} submissions so far. Continue with next batch...`);
  }
  
  console.log(`\n${separator}`);
  console.log(`✅ COMPLETED PROCESSING ${processed} SUBMISSIONS`);
  console.log(separator);
  
  return processed;
}

// Process comments in batches
async function processComments() {
  console.log('\n🔄 PROCESSING USER COMMENTS IN BATCHES...');
  
  let processed = 0;
  let after = null;
  const batchSize = 25; // Process 25 comments at a time
  
  // Helper for visual separators
  const separator = "=".repeat(80);
  const smallSeparator = "-".repeat(40);

  while (true) {
    console.log(`\n${separator}`);
    console.log(`📥 FETCHING BATCH OF COMMENTS (after: ${after || 'start'})`);
    console.log(separator);
    
    // Get a batch of comments
    const commentsListing = await reddit.getMe().getComments({
      limit: batchSize,
      after: after
    });
    
    const comments = await commentsListing;
    if (comments.length === 0) {
      console.log('\n❌ No more comments to process.');
      break;
    }
    
    console.log(`📋 Found ${comments.length} comments in this batch.\n`);
    
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      const randomContent = generateRandomContent();
      const originalContent = truncateToWords(comment.body, 30);
      processed++;
      
      console.log(smallSeparator);
      console.log(`🔄 [${processed}] Processing comment on: ${comment.link_title}`);
      console.log(`📝 ORIGINAL: "${originalContent}"`);
      console.log(`🔀 REPLACING WITH: "${randomContent}"`);
      
      try {
        // Edit the comment
        console.log('📝 Editing comment content...');
        await comment.edit(randomContent);
        console.log('✅ Successfully edited comment.');
        
        // Delete the comment
        console.log('🗑️  Deleting comment...');
        await comment.delete();
        console.log('✅ Successfully deleted comment.');
        
        // Delay to avoid rate limiting
        await delay(2000);
      } catch (error) {
        console.error(`❌ Error processing comment: ${error.message}`);
      }
    }
    
    // Save the fullname of the last item for pagination
    after = comments.length > 0 ? comments[comments.length - 1].name : null;
    
    // If we got fewer than the requested batch size, we've reached the end
    if (comments.length < batchSize) {
      console.log('\n❌ No more comments to process.');
      break;
    }
    
    console.log(`\n📊 Processed ${processed} comments so far. Continue with next batch...`);
  }
  
  console.log(`\n${separator}`);
  console.log(`✅ COMPLETED PROCESSING ${processed} COMMENTS`);
  console.log(separator);
  
  return processed;
}

// Main function
async function main() {
  // Helper for visual separators
  const separator = "=".repeat(80);
  const smallSeparator = "-".repeat(40);
  
  // Start tracking time and statistics
  const startTime = Date.now();
  let submissionCount = 0;
  let commentCount = 0;
  
  try {
    console.log(separator);
    console.log('🚀 STARTING REDDIT NUKE...');
    console.log(separator);
    console.log(`⏱️  Start time: ${new Date(startTime).toLocaleString()}`);
    
    // Verify authentication first
    console.log('\n🔑 Verifying Reddit credentials...');
    const me = await reddit.getMe();
    console.log(`✅ Authenticated as: ${me.name}\n`);
    
    // Process submissions and get count
    submissionCount = await processSubmissions();
    
    // Process comments and get count
    commentCount = await processComments();
    
    // Calculate time taken
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000; // Convert to seconds
    
    // Format time in a readable way
    const formatTime = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      return [
        hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : '',
        minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : '',
        `${secs} second${secs !== 1 ? 's' : ''}`
      ].filter(Boolean).join(', ');
    };
    
    // Display summary statistics
    console.log(`\n${separator}`);
    console.log('📊 REDDIT NUKE SUMMARY');
    console.log(separator);
    console.log(`✅ Total submissions processed: ${submissionCount}`);
    console.log(`✅ Total comments processed: ${commentCount}`);
    console.log(`✅ Total items processed: ${submissionCount + commentCount}`);
    console.log(`⏱️  Start time: ${new Date(startTime).toLocaleString()}`);
    console.log(`⏱️  End time: ${new Date(endTime).toLocaleString()}`);
    console.log(`⏱️  Total time taken: ${formatTime(timeTaken)}`);
    if (submissionCount + commentCount > 0) {
      console.log(`⚡ Average processing time per item: ${formatTime(timeTaken / (submissionCount + commentCount))}`);
    }
    
    console.log(`\n${separator}`);
    console.log('✅ REDDIT NUKE COMPLETED SUCCESSFULLY!');
    console.log(separator);
  } catch (error) {
    // Calculate time even if there's an error
    const errorTime = Date.now();
    const timeTaken = (errorTime - startTime) / 1000;
    
    console.log(`\n${separator}`);
    console.error(`❌ FATAL ERROR: ${error.message}`);
    console.log(separator);
    
    if (error.message.includes("Invalid grant")) {
      console.error("\n🔑 Likely causes of this error:");
      console.error("1️⃣ Incorrect username or password in .env file");
      console.error("2️⃣ Reddit API client credentials are incorrect");
      console.error("3️⃣ Your Reddit account has two-factor authentication enabled");
      console.error("4️⃣ Your account was temporarily locked due to suspicious activity");
      console.error("\n🔍 Please check your .env file and Reddit account settings.");
    }
    
    // Show partial statistics if possible
    if (submissionCount > 0 || commentCount > 0) {
      console.log(`\n${separator}`);
      console.log('📊 PARTIAL PROGRESS BEFORE ERROR');
      console.log(separator);
      console.log(`✅ Submissions processed: ${submissionCount}`);
      console.log(`✅ Comments processed: ${commentCount}`);
      console.log(`⏱️  Time elapsed before error: ${(timeTaken / 60).toFixed(2)} minutes`);
      console.log(separator);
    }
  }
}

// Run the program
main();