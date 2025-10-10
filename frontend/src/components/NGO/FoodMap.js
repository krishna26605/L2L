import { useEffect, useRef, useState } from 'react';

export const FoodMap = ({ donations, onMarkerClick, selectedDonation }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setLoadError('Google Maps API key not configured');
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Wait for Google Maps to initialize
      const checkInit = () => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
        } else {
          setTimeout(checkInit, 100);
        }
      };
      checkInit();
    };

    script.onerror = () => {
      setLoadError('Failed to load Google Maps');
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    // Initialize map
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: 37.7749, lng: -122.4194 },
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
    });

    setMap(mapInstance);

    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapInstance.setCenter(userLocation);
          mapInstance.setZoom(12);
        },
        (error) => {
          console.log('Location access denied or unavailable');
        }
      );
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!map || !donations || !window.google) return;

    // Clear existing markers
    const markers = [];
    const bounds = new window.google.maps.LatLngBounds();

    donations.forEach((donation) => {
      // Skip donations without coordinates
      if (!donation.location?.coordinates?.lat || !donation.location?.coordinates?.lng) {
        return;
      }

      const position = {
        lat: donation.location.coordinates.lat,
        lng: donation.location.coordinates.lng,
      };

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: donation.title,
        icon: {
          url: getMarkerIcon(donation.status),
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-xs">
            <h3 class="font-semibold text-sm mb-1">${donation.title}</h3>
            <p class="text-xs text-gray-600 mb-2">${donation.description}</p>
            <div class="text-xs text-gray-500">
              <div><strong>Quantity:</strong> ${donation.quantity}</div>
              <div><strong>Type:</strong> ${donation.foodType}</div>
              <div><strong>Expires:</strong> ${new Date(donation.expiryTime).toLocaleDateString()}</div>
              <div class="mt-1">
                <span class="inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(donation.status)}">
                  ${donation.status}
                </span>
              </div>
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        if (onMarkerClick) {
          onMarkerClick(donation);
        }
      });

      markers.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
      map.fitBounds(bounds);
    }

    // Cleanup
    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, [map, donations, onMarkerClick]);

  const getMarkerIcon = (status) => {
    const colors = {
      available: '#22c55e',
      claimed: '#f59e0b',
      picked: '#8b5cf6',
      expired: '#ef4444',
    };
    const color = colors[status] || colors.available;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `)}`;
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      available: 'bg-green-100 text-green-800',
      claimed: 'bg-orange-100 text-orange-800',
      picked: 'bg-purple-100 text-purple-800',
      expired: 'bg-red-100 text-red-800',
    };
    return classes[status] || classes.available;
  };

  if (loadError) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Failed to load map</p>
          <p className="text-sm mt-2">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg relative">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="font-semibold mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span>Claimed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span>Picked</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Expired</span>
          </div>
        </div>
      </div>
    </div>
  );
};