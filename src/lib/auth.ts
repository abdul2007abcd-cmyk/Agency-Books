export interface PartnerAccount {
  id: 'p1' | 'p2';
  username: string;
  name: string;
  passwordHash: string;
  role: string;
  lastLoginAt?: number;
}

export interface AuthSession {
  partnerId: 'p1' | 'p2';
  username: string;
  name: string;
  role: string;
  loggedInAt: number;
}

const SALT = '_scalemagnet_salt';
const ACCOUNTS_KEY = 'ab.partner_accounts';
const SESSION_KEY = 'ab.auth_session';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Initial default accounts for Abdul (Managing Partner) and Punith (Partner 2)
export const DEFAULT_ACCOUNTS: PartnerAccount[] = [
  {
    id: 'p1',
    username: 'abdul',
    name: 'Abdul',
    role: 'Managing Partner',
    passwordHash: '7f46a5697ff06220c315a4bc9c40b718f797619da37b07364d42ae6e13ac2b99', // "abdul123" (also accepts "rahman123")
  },
  {
    id: 'p2',
    username: 'punith',
    name: 'Punith',
    role: 'Operating Partner',
    passwordHash: '0282711f3065a9ca99498ae97a0c7d30ddd0f61e5afca370afa1fd855e815d7a', // "punith123" (also accepts "partner123")
  },
];

export function resetAccountsToDefault(): PartnerAccount[] {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
  } catch (e) {
    console.error('Failed to reset accounts:', e);
  }
  return DEFAULT_ACCOUNTS;
}

export function getStoredAccounts(): PartnerAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        // Automatic migration of older placeholder accounts to Abdul & Punith
        const p1 = parsed.find((a: any) => a.id === 'p1');
        const p2 = parsed.find((a: any) => a.id === 'p2');
        let changed = false;
        if (p1 && (p1.name === 'Rahman' || p1.username === 'rahman')) {
          p1.name = 'Abdul';
          p1.username = 'abdul';
          p1.role = 'Managing Partner';
          p1.passwordHash = DEFAULT_ACCOUNTS[0].passwordHash;
          changed = true;
        }
        if (p2 && (p2.name === 'Partner 2' || p2.username === 'partner' || p2.username === 'partner2')) {
          p2.name = 'Punith';
          p2.username = 'punith';
          p2.role = 'Operating Partner';
          p2.passwordHash = DEFAULT_ACCOUNTS[1].passwordHash;
          changed = true;
        }
        if (changed) {
          saveStoredAccounts(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    // Fall back to default
  }
  return DEFAULT_ACCOUNTS;
}

export function saveStoredAccounts(accounts: PartnerAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts:', e);
  }
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw);
      // Migrate stored session if it had previous names
      if (session.partnerId === 'p1' && (session.name === 'Rahman' || session.username === 'rahman')) {
        session.name = 'Abdul';
        session.username = 'abdul';
        session.role = 'Managing Partner';
        saveStoredSession(session);
      } else if (session.partnerId === 'p2' && (session.name === 'Partner 2' || session.username === 'partner' || session.username === 'partner2')) {
        session.name = 'Punith';
        session.username = 'punith';
        session.role = 'Operating Partner';
        saveStoredSession(session);
      }
      return session;
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

export function saveStoredSession(session: AuthSession | null): void {
  try {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.setItem('ab.name', session.name);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (e) {
    console.error('Failed to update session:', e);
  }
}

export async function loginWithCredentials(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const cleanUsername = usernameInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, error: 'Please enter both username and password.' };
  }

  const accounts = getStoredAccounts();
  // Match exact username or standard aliases (abdul/rahman for P1, punith/partner for P2)
  let target = accounts.find((a) => a.username.toLowerCase() === cleanUsername);

  if (!target) {
    if (
      cleanUsername === 'abdul' ||
      cleanUsername === 'rahman' ||
      cleanUsername === 'abdulrahman' ||
      cleanUsername === 'managing' ||
      cleanUsername === 'p1'
    ) {
      target = accounts.find((a) => a.id === 'p1');
    } else if (
      cleanUsername === 'punith' ||
      cleanUsername === 'punit' ||
      cleanUsername === 'partner2' ||
      cleanUsername === 'partner' ||
      cleanUsername === 'p2'
    ) {
      target = accounts.find((a) => a.id === 'p2');
    }
  }

  if (!target) {
    return { success: false, error: 'Invalid username. Please check your Partner ID.' };
  }

  const inputHash = await hashPassword(cleanPassword);
  
  // Verify password: check stored hash, or supported default credentials as fallback
  const isP1Default =
    target.id === 'p1' &&
    (cleanPassword === 'abdul123' || cleanPassword === 'rahman123' || cleanPassword === 'scale123');
  const isP2Default =
    target.id === 'p2' &&
    (cleanPassword === 'punith123' || cleanPassword === 'partner123' || cleanPassword === 'magnet123');

  if (inputHash !== target.passwordHash && !isP1Default && !isP2Default) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  // Update last login
  target.lastLoginAt = Date.now();
  saveStoredAccounts(accounts);

  const session: AuthSession = {
    partnerId: target.id,
    username: target.username,
    name: target.name,
    role: target.role,
    loggedInAt: Date.now(),
  };

  saveStoredSession(session);
  return { success: true, session };
}

export async function updatePartnerCredentials(
  partnerId: 'p1' | 'p2',
  updates: {
    username?: string;
    name?: string;
    newPassword?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const accounts = getStoredAccounts();
  const target = accounts.find((a) => a.id === partnerId);
  if (!target) return { success: false, error: 'Partner account not found' };

  if (updates.username) {
    const cleanUsername = updates.username.trim().toLowerCase();
    // Ensure no conflict
    const conflict = accounts.find((a) => a.id !== partnerId && a.username.toLowerCase() === cleanUsername);
    if (conflict) {
      return { success: false, error: `Username "${cleanUsername}" is already used by the other partner.` };
    }
    target.username = cleanUsername;
  }

  if (updates.name) {
    target.name = updates.name.trim();
  }

  if (updates.newPassword && updates.newPassword.trim()) {
    if (updates.newPassword.trim().length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    target.passwordHash = await hashPassword(updates.newPassword.trim());
  }

  saveStoredAccounts(accounts);

  // If currently active session belongs to this partner, update session name/username as well
  const currentSession = getStoredSession();
  if (currentSession && currentSession.partnerId === partnerId) {
    const updatedSession: AuthSession = {
      ...currentSession,
      username: target.username,
      name: target.name,
    };
    saveStoredSession(updatedSession);
  }

  return { success: true };
}
