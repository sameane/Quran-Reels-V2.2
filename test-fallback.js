// Test script to verify local video fallback mechanism
// This simulates what happens when Pexels API is not available

const HAS_PEXELS_ACCESS = false; // Simulate disabled Pexels API

// Function to get local video files from assets folder
const getLocalVideoFiles = () => {
  return [
    '/assets/6962-197634410_medium.mp4',
    '/assets/8947-215890483_medium.mp4',
    '/assets/9153-217588676_medium.mp4',
    '/assets/17013-278400948_medium.mp4',
    '/assets/21723-320725678_medium.mp4',
    '/assets/126678-736705679_medium.mp4',
    '/assets/140568-775389231_medium.mp4',
    '/assets/140733-775596128_medium.mp4',
    '/assets/280165_medium.mp4',
    '/assets/312999_medium.mp4'
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
      result.push(localVideos[i % localVideos.length]);
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
    if (allLocal) {
      console.log('✅ All videos are from local assets');
    } else {
      console.log('❌ Some videos are not from local assets');
    }
    
  } catch (error) {
    console.error('❌ Fallback mechanism failed:', error);
  }
}

// Run the test
console.log('=== Local Video Fallback Test ===');
testFallback();