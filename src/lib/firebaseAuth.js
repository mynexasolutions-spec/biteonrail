import { auth } from './firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

/**
 * Format phone number to E.164 (+91XXXXXXXXXX)
 */
export function formatPhoneNumber(phone) {
  const digitsOnly = String(phone).replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }
  if (String(phone).startsWith('+')) {
    return phone;
  }
  return `+91${digitsOnly.slice(-10)}`;
}

/**
 * Set up reCAPTCHA verifier for a container ID safely using a global permanent container.
 */
export function setupRecaptcha(containerId = 'global-recaptcha-container') {
  if (typeof window === 'undefined') return null;

  try {
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }

    if (window.recaptchaVerifier) {
      try {
        if (typeof window.grecaptcha !== 'undefined' && typeof window.grecaptcha.reset === 'function') {
          try {
            window.grecaptcha.reset();
          } catch (e) { }
        }
      } catch (e) { }
      return window.recaptchaVerifier;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': () => { },
      'expired-callback': () => {
        window.recaptchaVerifier = null;
      }
    });

    return window.recaptchaVerifier;
  } catch (error) {
    console.error('Error setting up RecaptchaVerifier:', error);
    return null;
  }
}

/**
 * Send OTP to user's phone via Firebase Phone Auth
 */
export async function sendFirebaseOtp(phone, containerId = 'global-recaptcha-container') {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    if (formattedPhone.length < 13) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    const appVerifier = setupRecaptcha(containerId);
    if (!appVerifier) {
      return { success: false, error: 'reCAPTCHA setup failed. Please refresh the page and try again.' };
    }

    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    return { success: true, confirmationResult, formattedPhone };
  } catch (error) {
    console.error('[Firebase Phone Auth Error Detail]:', error.code, error.message, error);
    console.error('[Firebase Phone Auth Error - customData]:', error.customData);
    console.error('[Firebase Phone Auth Error - raw serverResponse]:', error.customData?._tokenResponse || error.customData?.serverResponse || 'none');
    try { console.error('[Firebase Phone Auth Error - JSON]:', JSON.stringify(error, Object.getOwnPropertyNames(error))); } catch (e) { }

    // Automatic retry with fresh reset for Resend OTP edge cases
    if (error.code === 'auth/captcha-check-failed' || error.code === 'auth/argument-error' || error.code === 'auth/internal-error') {
      try {
        if (typeof window.grecaptcha !== 'undefined' && typeof window.grecaptcha.reset === 'function') {
          try { window.grecaptcha.reset(); } catch (e) { }
        }
        const freshVerifier = setupRecaptcha(containerId);
        if (freshVerifier) {
          const retryResult = await signInWithPhoneNumber(auth, formattedPhone, freshVerifier);
          return { success: true, confirmationResult: retryResult, formattedPhone };
        }
      } catch (retryErr) {
        console.error('[Firebase Resend Retry Error]:', retryErr.code, retryErr.message);
      }
    }

    let userMsg = 'Unable to send OTP. Please verify your mobile number and try again.';

    if (error.code === 'auth/invalid-phone-number') {
      userMsg = 'Please enter a valid 10-digit mobile number.';
    } else if (error.code === 'auth/too-many-requests') {
      userMsg = 'SMS rate limit reached. Please wait 1-2 minutes or add phone to Firebase Console -> Authentication -> Test Phone Numbers.';
    } else if (error.code === 'auth/captcha-check-failed') {
      userMsg = 'Security check failed. Please click Resend OTP again.';
    } else if (error.code === 'auth/billing-not-enabled' || error.code === 'auth/operation-not-allowed' || error.code === 'auth/quota-exceeded') {
      userMsg = 'Firebase SMS limit reached. Add phone under Firebase Console -> Auth -> Test Phone Numbers.';
    }

    return { success: false, error: userMsg, code: error.code };
  }
}

/**
 * Verify OTP using Firebase confirmationResult
 */
export async function verifyFirebaseOtp(confirmationResult, otpCode) {
  try {
    if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
      return { success: false, error: 'Session expired. Please request a new OTP.' };
    }
    const cleanOtp = String(otpCode).trim();
    if (cleanOtp.length !== 6) {
      return { success: false, error: 'Please enter the 6-digit OTP code sent to your mobile.' };
    }

    const result = await confirmationResult.confirm(cleanOtp);
    const user = result.user;

    // Retrieve cryptographically signed Firebase JWT ID token
    let idToken = null;
    try {
      if (user && typeof user.getIdToken === 'function') {
        idToken = await user.getIdToken();
      }
    } catch (e) {
      console.warn('Could not fetch JWT token:', e);
    }

    return { success: true, user, idToken };
  } catch (error) {
    console.error('[Firebase Verify Error Detail]:', error.code, error.message);
    let userMsg = 'Invalid verification code. Please check the OTP and try again.';
    if (error.code === 'auth/invalid-verification-code') {
      userMsg = 'Incorrect OTP entered. Please re-check the 6-digit code.';
    } else if (error.code === 'auth/code-expired') {
      userMsg = 'OTP code expired. Please click "Change Number" or request a new OTP.';
    }
    return { success: false, error: userMsg, code: error.code };
  }
}
