import { verifySessionToken } from './auth';

class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseCookies(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader.split(';').reduce((acc, c) => {
    const trimmed = c.trim();
    const index = trimmed.indexOf('=');
    if (index !== -1) {
      acc[trimmed.substring(0, index)] = decodeURIComponent(trimmed.substring(index + 1));
    }
    return acc;
  }, {});
}

// Returns { email, type, station_code } for any valid admin session, or throws AuthError.
export function requireAdmin(request) {
  const cookies = parseCookies(request);
  const token = cookies['Admin-Session'];
  const payload = token ? verifySessionToken(token) : null;
  if (!payload) throw new AuthError(401, 'Not authenticated');
  return payload;
}

// Like requireAdmin, but rejects station-scoped admins.
export function requireGlobalAdmin(request) {
  const session = requireAdmin(request);
  if (session.type !== 'global') throw new AuthError(403, 'Global admin access required');
  return session;
}

// Throws if a station-admin session doesn't match the given station code.
// Global admins always pass.
export function assertStationAccess(session, stationCode) {
  if (session.type === 'global') return;
  if (!stationCode || String(stationCode).toUpperCase() !== String(session.station_code).toUpperCase()) {
    throw new AuthError(403, 'Not authorized for this station');
  }
}

export { AuthError };
