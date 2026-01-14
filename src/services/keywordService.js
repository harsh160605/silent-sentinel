/**
 * Keyword Service - Handles smart suggestions for report input
 * Uses local defaults when Cloud Functions are unavailable
 */

// Cache for suggestions
let suggestionsCache = {
    keywords: [],
    templates: [],
    lastFetch: null,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

// Default templates
const DEFAULT_TEMPLATES = [
    { id: 'default-1', template: 'Suspicious person near my location', category: 'suspicious-activity', icon: '🚶' },
    { id: 'default-2', template: 'Street light not working', category: 'unsafe-infrastructure', icon: '💡' },
    { id: 'default-3', template: 'Reckless driving in the area', category: 'traffic', icon: '🚗' },
    { id: 'default-4', template: 'Harassment incident', category: 'harassment', icon: '⚠️' },
    { id: 'default-5', template: 'Loud noise disturbance', category: 'noise', icon: '🔊' },
    { id: 'default-6', template: 'Vandalism or property damage', category: 'vandalism', icon: '🏚️' },
    { id: 'default-7', template: 'Someone following me', category: 'harassment', icon: '👀' },
    { id: 'default-8', template: 'Theft in the area', category: 'theft', icon: '🏃' },
];

const DEFAULT_KEYWORDS = [
    { id: 'suspicious', keyword: 'suspicious activity', count: 50, category: 'suspicious-activity' },
    { id: 'following', keyword: 'following me', count: 40, category: 'harassment' },
    { id: 'unsafe', keyword: 'unsafe area', count: 35, category: 'perception' },
    { id: 'poorly-lit', keyword: 'poorly lit', count: 30, category: 'infrastructure' },
    { id: 'aggressive', keyword: 'aggressive behavior', count: 25, category: 'harassment' },
    { id: 'broken', keyword: 'broken streetlight', count: 20, category: 'infrastructure' },
    { id: 'theft', keyword: 'theft', count: 18, category: 'crime' },
    { id: 'noise', keyword: 'noise complaint', count: 15, category: 'noise' },
];

/**
 * Get smart suggestions
 * Uses local defaults - cloud functions require additional setup
 */
export const getSmartSuggestions = async (partialText = '', category = null) => {
    // Return local defaults immediately
    let templates = DEFAULT_TEMPLATES;
    let keywords = DEFAULT_KEYWORDS;

    // Filter by category if specified
    if (category) {
        templates = templates.filter(t => t.category === category);
        keywords = keywords.filter(k => k.category === category);
    }

    // Filter by partial text
    let suggestions = [];
    if (partialText && partialText.length >= 2) {
        const lowerText = partialText.toLowerCase();
        suggestions = keywords
            .filter(k => k.keyword.toLowerCase().includes(lowerText))
            .map(k => k.keyword)
            .slice(0, 5);
    }

    return {
        keywords,
        templates,
        suggestions,
    };
};

/**
 * Update keyword statistics after report submission
 * No-op without cloud functions
 */
export const updateKeywordStats = async (reportText, category = 'other', riskLevel = 'low') => {
    // No-op - cloud functions require additional setup
    return { success: true };
};

/**
 * Clear the suggestions cache
 */
export const clearSuggestionsCache = () => {
    suggestionsCache = {
        keywords: [],
        templates: [],
        lastFetch: null,
        cacheExpiry: 5 * 60 * 1000,
    };
};

/**
 * Debounce helper for suggestions as user types
 */
let debounceTimer = null;
export const debouncedGetSuggestions = (partialText, callback, delay = 300) => {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
        const suggestions = await getSmartSuggestions(partialText);
        callback(suggestions);
    }, delay);
};
