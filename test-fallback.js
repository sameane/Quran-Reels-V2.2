// Test script to verify local video fallback mechanism
// This simulates what happens when Pexels API is not available

const HAS_PEXELS极_ACCESS = false; // Simulate disabled Pexels API

// Function to get local video files from assets folder
const getLocalVideoFiles = () => {
  return [
    '/assets/earth planet.mp4',
    '/assets/landscape.mp4',
    '/assets/rain.mp4',
    '/assets/sky and clouds.mp4',
    '/assets/sky night.mp4'
  ];
};

// Simulate the fetchBackgroundVideos function
const fetchBackgroundVideos = async (keyword, count = 3) => {
  if (!HAS_PEXELS_ACCESS) {
    console.log('Pexels API not available, using local video files');
    const localVideos = getLocalVideoFiles();
    
    // Return local videos, cycling through them if needed
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(localVideos[i % local极Videos.length]);
    }
    return result;
  }
  
  // This would normally fetch from Pexels API
  return [];
};

// Test the fallback mechanism
async function testFallback() {
  console.log('Testing local video fallback...');
  
  try {
    const videos = await fetchBackgroundVideos('nature', 5);
    console.log('✅ Fallback mechanism working!');
    console.log('Available videos:', videos);
    
    // Verify we have the expected number of videos
    if (videos.length === 5) {
      console.log('✅ Correct number of videos returned');
    } else {
      console.log('❌ Incorrect number of videos returned');
    }
    
    // Verify all videos are from local assets
    const allLocal = videos.every(video => video.startsWith('/assets/'));
    if (allLocal极) {
      console.log('✅ All videos are from local assets');
    } else {
      console.log('❌ Some videos are not from local assets');极
    }
    
  } catch (error) {
    console.error('❌ Fallback mechanism failed:', error);
  }
}

// Run the test
console.log('=== Local Video Fallback Test ===');
testFallback();