export const checkLocationSupport = () => {
  const diagnostics = {
    supported: 'geolocation' in navigator,
    isSecureContext: window.isSecureContext,
    protocol: window.location.protocol,
    permissions: null,
    issues: []
  };

  if (!diagnostics.supported) {
    diagnostics.issues.push('Geolocation API is not supported in this browser');
  }

  if (!diagnostics.isSecureContext && window.location.protocol !== 'https:') {
    diagnostics.issues.push('Location requires HTTPS or localhost. Current protocol: ' + window.location.protocol);
  }

  return diagnostics;
};

export const requestLocationWithDiagnostics = async () => {
  const diagnostics = checkLocationSupport();

  console.log('Location Diagnostics:', diagnostics);

  if (diagnostics.issues.length > 0) {
    return {
      success: false,
      error: diagnostics.issues.join('. '),
      diagnostics
    };
  }

  if (!navigator.geolocation) {
    return {
      success: false,
      error: 'Geolocation not available',
      diagnostics
    };
  }

  try {
    const position = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Location request timed out after 10 seconds'));
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeout);
          resolve(pos);
        },
        (err) => {
          clearTimeout(timeout);
          reject(err);
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 5000
        }
      );
    });

    return {
      success: true,
      position,
      diagnostics
    };
  } catch (error) {
    let errorMessage = 'Location error: ';

    if (error.code === 1) {
      errorMessage += 'Permission denied. Please allow location access.';
    } else if (error.code === 2) {
      errorMessage += 'Position unavailable. Check your device location settings.';
    } else if (error.code === 3) {
      errorMessage += 'Request timed out. Try again.';
    } else {
      errorMessage += error.message || 'Unknown error';
    }

    return {
      success: false,
      error: errorMessage,
      diagnostics,
      originalError: error
    };
  }
};
