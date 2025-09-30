import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  // Check if user already exists to avoid overwriting their role/membership
  const existingUser = await storage.getUser(claims["sub"]);
  
  if (existingUser) {
    // User exists - only update profile information, preserve role/membership
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      // Don't include role/membershipStatus to preserve existing values
    });
  } else {
    // New user - use role from claims if provided, otherwise default to 'visitor'
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      role: claims["role"] || 'visitor',
      membershipStatus: 'free',
    });
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

// Track active token refresh operations to prevent race conditions
const refreshingTokens = new Map<string, Promise<any>>();

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced token refresh with retry logic
async function refreshTokenWithRetry(
  config: any,
  refreshToken: string,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<any> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AUTH] Token refresh attempt ${attempt}/${maxRetries}`);
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      console.log(`[AUTH] Token refresh successful on attempt ${attempt}`);
      return tokenResponse;
    } catch (error: any) {
      lastError = error;
      console.warn(`[AUTH] Token refresh attempt ${attempt} failed:`, {
        error: error.message,
        code: error.error,
        description: error.error_description,
        attempt,
        maxRetries
      });
      
      // Don't retry on certain non-recoverable errors
      if (error.error === 'invalid_grant' || 
          error.error === 'unauthorized_client' ||
          error.error === 'unsupported_grant_type') {
        console.error(`[AUTH] Non-recoverable token refresh error: ${error.error}`);
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`[AUTH] Waiting ${delay}ms before retry`);
        await sleep(delay);
      }
    }
  }
  
  console.error(`[AUTH] All token refresh attempts failed after ${maxRetries} tries`);
  throw lastError;
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const sessionId = req.sessionID;
  const user = req.user as any;
  const now = Math.floor(Date.now() / 1000);
  
  console.log(`[AUTH] Authentication check started`, {
    sessionId: sessionId?.substring(0, 8) + '...',
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!user,
    userExpiresAt: user?.expires_at,
    currentTime: now,
    url: req.url,
    method: req.method
  });

  // Check if user is authenticated and has required session data
  if (!req.isAuthenticated()) {
    console.warn(`[AUTH] Request not authenticated`, {
      sessionId: sessionId?.substring(0, 8) + '...',
      url: req.url
    });
    return res.status(401).json({ 
      message: "Not authenticated", 
      code: "NO_AUTH",
      timestamp: new Date().toISOString()
    });
  }

  if (!user) {
    console.warn(`[AUTH] No user object in session`, {
      sessionId: sessionId?.substring(0, 8) + '...',
      url: req.url
    });
    return res.status(401).json({ 
      message: "Invalid session state", 
      code: "NO_USER",
      timestamp: new Date().toISOString()
    });
  }

  if (!user.expires_at) {
    console.warn(`[AUTH] User missing expiration timestamp`, {
      sessionId: sessionId?.substring(0, 8) + '...',
      userId: user.claims?.sub?.substring(0, 8) + '...',
      url: req.url
    });
    return res.status(401).json({ 
      message: "Invalid token state", 
      code: "NO_EXPIRY",
      timestamp: new Date().toISOString()
    });
  }

  // Token is still valid, proceed
  if (now <= user.expires_at) {
    console.log(`[AUTH] Token valid, proceeding`, {
      sessionId: sessionId?.substring(0, 8) + '...',
      userId: user.claims?.sub?.substring(0, 8) + '...',
      expiresIn: user.expires_at - now + ' seconds'
    });
    return next();
  }

  // Token expired, need to refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    console.warn(`[AUTH] No refresh token available`, {
      sessionId: sessionId?.substring(0, 8) + '...',
      userId: user.claims?.sub?.substring(0, 8) + '...',
      expiredSince: now - user.expires_at + ' seconds ago'
    });
    return res.status(401).json({ 
      message: "Session expired and cannot be refreshed", 
      code: "NO_REFRESH_TOKEN",
      timestamp: new Date().toISOString()
    });
  }

  console.log(`[AUTH] Token expired, attempting refresh`, {
    sessionId: sessionId?.substring(0, 8) + '...',
    userId: user.claims?.sub?.substring(0, 8) + '...',
    expiredSince: now - user.expires_at + ' seconds ago'
  });

  // Check if token refresh is already in progress for this session
  const refreshKey = sessionId || `user_${user.claims?.sub}`;
  const existingRefresh = refreshingTokens.get(refreshKey);
  
  if (existingRefresh) {
    console.log(`[AUTH] Token refresh already in progress, waiting`, {
      sessionId: sessionId?.substring(0, 8) + '...',
      refreshKey: refreshKey.substring(0, 16) + '...'
    });
    
    try {
      await existingRefresh;
      console.log(`[AUTH] Concurrent refresh completed successfully`);
      return next();
    } catch (error: any) {
      console.error(`[AUTH] Concurrent refresh failed`, {
        error: error.message,
        sessionId: sessionId?.substring(0, 8) + '...'
      });
      return res.status(401).json({ 
        message: "Token refresh failed", 
        code: "REFRESH_FAILED",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Start token refresh with race condition protection
  const refreshPromise = (async () => {
    try {
      const config = await getOidcConfig();
      const tokenResponse = await refreshTokenWithRetry(config, refreshToken);
      updateUserSession(user, tokenResponse);
      
      console.log(`[AUTH] Token refresh completed successfully`, {
        sessionId: sessionId?.substring(0, 8) + '...',
        userId: user.claims?.sub?.substring(0, 8) + '...',
        newExpiresAt: user.expires_at
      });
      
      return tokenResponse;
    } catch (error: any) {
      console.error(`[AUTH] Token refresh failed permanently`, {
        error: error.message,
        code: error.error,
        description: error.error_description,
        sessionId: sessionId?.substring(0, 8) + '...',
        userId: user.claims?.sub?.substring(0, 8) + '...'
      });
      throw error;
    } finally {
      // Clean up the refresh tracking
      refreshingTokens.delete(refreshKey);
    }
  })();
  
  // Track the refresh to prevent race conditions
  refreshingTokens.set(refreshKey, refreshPromise);

  try {
    await refreshPromise;
    console.log(`[AUTH] Authentication successful after token refresh`);
    return next();
  } catch (error: any) {
    console.error(`[AUTH] Authentication failed after token refresh attempts`, {
      error: error.message,
      code: error.error,
      sessionId: sessionId?.substring(0, 8) + '...'
    });
    
    return res.status(401).json({ 
      message: "Authentication failed - token refresh unsuccessful", 
      code: "TOKEN_REFRESH_FAILED",
      error: error.error || error.message,
      description: error.error_description,
      timestamp: new Date().toISOString()
    });
  }
};
