import { useState, useEffect } from 'react';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setLoadError('Google Maps API key is not configured');
      return;
    }

    // Check if script is already loading
    if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
      // Script is already loading, wait for it
      const checkLoaded = () => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Load Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for Google Maps to be fully initialized
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          setLoadError(null);
        } else {
          setTimeout(checkGoogleMaps, 100);
        }
      };
      checkGoogleMaps();
    };

    script.onerror = () => {
      setLoadError('Failed to load Google Maps');
      setIsLoaded(false);
    };

    document.head.appendChild(script);
  }, []);

  // Create autocomplete function
  const createAutocomplete = (inputElement, options = {}) => {
    if (!isLoaded || !window.google || !window.google.maps.places) {
      throw new Error('Google Maps Places library not loaded');
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
      types: ['address'],
      ...options
    });

    return autocomplete;
  };

  // Get current location function
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  };

  // Reverse geocode function
  const reverseGeocode = (lat, lng) => {
    return new Promise((resolve, reject) => {
      if (!isLoaded || !window.google) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            address: results[0].formatted_address,
            lat,
            lng,
          });
        } else {
          reject(new Error('Reverse geocoding failed: ' + status));
        }
      });
    });
  };

  return {
    isLoaded,
    loadError,
    createAutocomplete,
    getCurrentLocation,
    reverseGeocode
  };
};












// import { useState, useEffect } from 'react';
// import { loadGoogleMapsWithoutCallback, isGoogleMapsLoaded } from '../lib/googleMapsLoader';

// export const useGoogleMaps = () => {
//   const [isLoaded, setIsLoaded] = useState(isGoogleMapsLoaded());
//   const [loadError, setLoadError] = useState(null);

//   useEffect(() => {
//     if (isGoogleMapsLoaded()) {
//       setIsLoaded(true);
//       return;
//     }

//     loadGoogleMapsWithoutCallback()
//       .then(() => {
//         setIsLoaded(true);
//         setLoadError(null);
//         console.log('🎯 Google Maps ready to use');
//       })
//       .catch((error) => {
//         console.error('❌ Google Maps load error:', error);
//         setLoadError(error.message);
//         setIsLoaded(false);
//       });
//   }, []);

//   // Create map function
//   const createMap = (element, options = {}) => {
//     if (!isLoaded || !window.google) {
//       throw new Error('Google Maps not loaded');
//     }

//     const defaultOptions = {
//       zoom: 12,
//       center: { lat: 37.7749, lng: -122.4194 },
//       mapTypeId: window.google.maps.MapTypeId.ROADMAP,
//       ...options,
//     };

//     return new window.google.maps.Map(element, defaultOptions);
//   };

//   // Create marker function
//   const createMarker = (map, position, options = {}) => {
//     if (!isLoaded || !window.google) {
//       throw new Error('Google Maps not loaded');
//     }

//     const defaultOptions = {
//       position,
//       map,
//       ...options,
//     };

//     return new window.google.maps.Marker(defaultOptions);
//   };

//   // Create info window function
//   const createInfoWindow = (content, options = {}) => {
//     if (!isLoaded || !window.google) {
//       throw new Error('Google Maps not loaded');
//     }

//     return new window.google.maps.InfoWindow({
//       content,
//       ...options,
//     });
//   };

//   // Create autocomplete function
//   const createAutocomplete = (inputElement, options = {}) => {
//     if (!isLoaded || !window.google || !window.google.maps.places) {
//       throw new Error('Google Maps Places library not loaded');
//     }

//     const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
//       types: ['address'],
//       componentRestrictions: { country: 'us' },
//       ...options
//     });

//     return autocomplete;
//   };

//   // Geocode address function
//   const geocodeAddress = (address) => {
//     return new Promise((resolve, reject) => {
//       if (!isLoaded || !window.google) {
//         reject(new Error('Google Maps not loaded'));
//         return;
//       }

//       const geocoder = new window.google.maps.Geocoder();
//       geocoder.geocode({ address }, (results, status) => {
//         if (status === 'OK' && results[0]) {
//           const location = results[0].geometry.location;
//           resolve({
//             lat: location.lat(),
//             lng: location.lng(),
//             address: results[0].formatted_address,
//           });
//         } else {
//           reject(new Error('Geocoding failed: ' + status));
//         }
//       });
//     });
//   };

//   // Reverse geocode function
//   const reverseGeocode = (lat, lng) => {
//     return new Promise((resolve, reject) => {
//       if (!isLoaded || !window.google) {
//         reject(new Error('Google Maps not loaded'));
//         return;
//       }

//       const geocoder = new window.google.maps.Geocoder();
//       geocoder.geocode({ location: { lat, lng } }, (results, status) => {
//         if (status === 'OK' && results[0]) {
//           resolve({
//             address: results[0].formatted_address,
//             lat,
//             lng,
//           });
//         } else {
//           reject(new Error('Reverse geocoding failed: ' + status));
//         }
//       });
//     });
//   };

//   // Calculate distance function
//   const calculateDistance = (lat1, lng1, lat2, lng2) => {
//     if (!isLoaded || !window.google) {
//       throw new Error('Google Maps not loaded');
//     }

//     const point1 = new window.google.maps.LatLng(lat1, lng1);
//     const point2 = new window.google.maps.LatLng(lat2, lng2);
    
//     return window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2) / 1000;
//   };

//   // Get current location function
//   const getCurrentLocation = () => {
//     return new Promise((resolve, reject) => {
//       if (!navigator.geolocation) {
//         reject(new Error('Geolocation is not supported by this browser'));
//         return;
//       }

//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           resolve({
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//           });
//         },
//         (error) => {
//           reject(error);
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 300000,
//         }
//       );
//     });
//   };

//   return {
//     isLoaded,
//     loadError,
//     createMap,
//     createMarker,
//     createInfoWindow,
//     createAutocomplete,
//     geocodeAddress,
//     reverseGeocode,
//     calculateDistance,
//     getCurrentLocation,
//   };
// };