let googleMapsLoaded = false;
let loadPromise = null;

export const loadGoogleMaps = () => {
  if (googleMapsLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('Google Maps API key is not configured'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    // Poll for Google Maps to be loaded
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        googleMapsLoaded = true;
        console.log('✅ Google Maps API loaded');
        resolve();
        return true;
      }
      return false;
    };

    script.onload = () => {
      console.log('📜 Google Maps script loaded, waiting for initialization...');
      
      // Start polling for Google Maps to be ready
      const maxAttempts = 50;
      let attempts = 0;
      
      const poll = () => {
        attempts++;
        if (checkGoogleMaps()) {
          return;
        }
        
        if (attempts >= maxAttempts) {
          reject(new Error('Google Maps failed to initialize within timeout'));
          return;
        }
        
        setTimeout(poll, 100);
      };
      
      poll();
    };

    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps script:', error);
      loadPromise = null;
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

// Alias for backward compatibility
export const loadGoogleMapsWithoutCallback = loadGoogleMaps;

export const isGoogleMapsLoaded = () => {
  return googleMapsLoaded;
};










// let googleMapsLoaded = false;
// let loadPromise = null;

// export const loadGoogleMaps = () => {
//   if (googleMapsLoaded) {
//     return Promise.resolve();
//   }

//   if (loadPromise) {
//     return loadPromise;
//   }

//   loadPromise = new Promise((resolve, reject) => {
//     // Check if Google Maps is already loaded
//     if (window.google && window.google.maps && window.google.maps.places) {
//       googleMapsLoaded = true;
//       resolve();
//       return;
//     }

//     const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
//     if (!apiKey) {
//       reject(new Error('Google Maps API key is not configured'));
//       return;
//     }

//         const script = document.createElement('script');
//         script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
//         script.async = true;
//         script.defer = true;

//     // Set up callback
//     window.initGoogleMaps = () => {
//       googleMapsLoaded = true;
//       resolve();
//     };

//     script.onerror = () => {
//       loadPromise = null;
//       reject(new Error('Failed to load Google Maps API'));
//     };

//     document.head.appendChild(script);
//   });

//   return loadPromise;
// };

// export const isGoogleMapsLoaded = () => {
//   return googleMapsLoaded;
// };