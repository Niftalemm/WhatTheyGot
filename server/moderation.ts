/**
 * Content moderation service using Google Perspective API
 * Provides AI-powered toxicity detection for user reviews and messages
 */

import crypto from 'crypto';

// Create hash for device-based banning
export function createDeviceHash(deviceId: string): string {
  const salt = process.env.DEVICE_HASH_SALT;
  if (!salt) {
    throw new Error('DEVICE_HASH_SALT environment variable is required for secure device hashing');
  }
  return crypto.createHash('sha256').update(`${deviceId}${salt}`).digest('hex');
}

interface PerspectiveApiResponse {
  attributeScores: Record<string, {
    summaryScore: {
      value: number;
    };
  }>;
}

interface ModerationResult {
  action: 'approved' | 'shadow' | 'rejected';
  scores: Record<string, number>;
  reason: string;
}

interface ModerationProvider {
  checkText(text: string, context?: string): Promise<ModerationResult>;
}

class PerspectiveModerationProvider implements ModerationProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';
  
  // Toxicity thresholds for different actions
  private readonly thresholds = {
    reject: 0.85,  // Auto-reject if ANY category exceeds this
    shadow: 0.6,   // Shadow-ban if ANY category exceeds this
    approved: 0.6  // Below this in all categories = approved
  };

  // Categories to check with Perspective API
  private readonly categories = [
    'TOXICITY',
    'SEVERE_TOXICITY', 
    'IDENTITY_ATTACK',
    'INSULT',
    'PROFANITY',
    'THREAT'
  ];

  constructor() {
    const apiKey = process.env.PERSPECTIVE_API_KEY;
    if (!apiKey) {
      throw new Error('PERSPECTIVE_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
  }

  async checkText(text: string, context = 'review'): Promise<ModerationResult> {
    if (!text || text.trim().length === 0) {
      return {
        action: 'approved',
        scores: {},
        reason: 'Empty text'
      };
    }

    try {
      const requestData = {
        comment: { text },
        requestedAttributes: this.categories.reduce((acc, category) => ({
          ...acc,
          [category]: {}
        }), {}),
        languages: ['en']
      };

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        console.error(`Perspective API error: ${response.status} ${response.statusText}`);
        // On API failure, shadow the content for manual review
        return {
          action: 'shadow',
          scores: {},
          reason: 'API error - requires manual review'
        };
      }

      const data: PerspectiveApiResponse = await response.json();
      
      // Extract scores from response
      const scores: Record<string, number> = {};
      let maxScore = 0;
      let maxCategory = '';

      for (const category of this.categories) {
        const score = data.attributeScores[category]?.summaryScore?.value || 0;
        scores[category] = score;
        if (score > maxScore) {
          maxScore = score;
          maxCategory = category;
        }
      }

      // Determine action based on highest score
      if (maxScore >= this.thresholds.reject) {
        return {
          action: 'rejected',
          scores,
          reason: `High ${maxCategory.toLowerCase()} detected (${Math.round(maxScore * 100)}%)`
        };
      } else if (maxScore >= this.thresholds.shadow) {
        return {
          action: 'shadow',
          scores,
          reason: `Moderate ${maxCategory.toLowerCase()} detected (${Math.round(maxScore * 100)}%) - requires review`
        };
      } else {
        return {
          action: 'approved',
          scores,
          reason: 'Content appears safe'
        };
      }

    } catch (error) {
      console.error('Perspective API error:', error);
      // On API error, approve content but log for manual review if needed
      return {
        action: 'approved',
        scores: {},
        reason: 'API error - auto-approved for user experience'
      };
    }
  }
}

// (Device hash function moved to top of file)

// Simple in-memory cache for moderation results to avoid duplicate API calls
const moderationCache = new Map<string, { result: ModerationResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(text: string): string {
  return crypto.createHash('md5').update(text.toLowerCase().trim()).digest('hex');
}

export class CachedModerationProvider implements ModerationProvider {
  private provider: PerspectiveModerationProvider;

  constructor() {
    this.provider = new PerspectiveModerationProvider();
  }

  async checkText(text: string, context?: string): Promise<ModerationResult> {
    const cacheKey = getCacheKey(text);
    const cached = moderationCache.get(cacheKey);
    
    // Return cached result if it's still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.result;
    }

    // Get fresh result from API
    const result = await this.provider.checkText(text, context);
    
    // Cache the result
    moderationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Clean up expired cache entries occasionally
    if (moderationCache.size > 1000) {
      const now = Date.now();
      const keysToDelete: string[] = [];
      moderationCache.forEach((value, key) => {
        if (now - value.timestamp > CACHE_DURATION) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => moderationCache.delete(key));
    }

    return result;
  }
}

// Export the main moderation provider
export const moderationProvider = new CachedModerationProvider();