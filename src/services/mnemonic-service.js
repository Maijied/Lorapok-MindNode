/**
 * Mnemonic Service
 * Implements a secure recovery phrase system.
 */

const WORDLIST = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "accelerate", "accent", "accept", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "active", "actor", "actress", "actual", "adapt", "add", "address", "adjust", "admit", "adult", "advance", "advice", "advise", "aerobic", "affair", "affect", "afford", "afraid", "after", "again", "agent", "agree", "ahead", "aim", "air", "airport", "album", "alcohol", "alert", "algebra", "alien", "all", "alley", "allot", "allow", "almost", "alone", "alpha", "already", "alright", "also", "alter", "always", "amaze", "amber", "ambition", "amplify", "amuse", "analyze", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annoy", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "apply", "appoint", "approve", "april", "arch", "arctic", "area", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "artist", "asset", "assist", "assume", "astonish", "astray", "astride", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audio", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "award", "aware", "awesome", "awful", "awkward", "axis", "axle", "azure", "baby", "bach", "bacon", "badge", "bag", "balance", "balcony", "ball", "balloon", "ballot", "banana", "band", "banner", "bar", "bare", "bargain", "barrel", "barrier", "base", "basic", "basket", "batch", "bath", "battle", "beach", "beam", "bean", "bear", "beast", "beat", "beauty", "because", "become", "bed", "beehive", "before", "begin", "behave", "behind", "believe", "bell", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "big", "bike", "bill", "binary", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "blaze", "bleak", "blend", "bless", "blind", "blink", "bliss", "block", "blog", "blossom", "blue", "blur", "blush", "board", "boat", "body", "boil", "bold", "bolt", "bomb", "bond", "bone", "bonus", "book", "boost", "boot", "border", "bore", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brake", "branch", "brand", "brass", "brave", "bravo", "break", "breath", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broad", "broadcast", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabin", "cable", "cactus", "cage", "cake", "calculate", "call", "calm", "camera", "camp", "can", "canal", "canary", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "capture", "car", "card", "cargo", "care", "career", "cargo", "carpet", "carry", "cart", "case", "cash", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "cause", "caution", "cave", "cease", "ceiling", "celebrate", "celery", "cell", "cement", "census", "century", "ceremony", "certain", "chain", "chair", "chalk", "champion", "change", "channel", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "child", "chill", "chime", "chimney", "china", "chip", "choice", "choose", "chord", "chorus", "chronic", "chunk", "churn", "cider", "cigar", "cinema", "circle", "circuit", "cite", "city", "civic", "civil", "claim", "clamp", "clan", "clash", "clasp", "class", "claw", "clay", "clean", "clear", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "close", "cloth", "cloud", "clover", "club", "clump", "cluster", "clutch", "coach", "coast", "coat", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "compass", "complex", "compose", "compute", "concave", "concept", "concern", "concert", "concise", "conclude", "concrete", "condense", "conduct", "cone", "confirm", "connect", "conquer", "consent", "conserve", "consider", "consist", "console", "constant", "consume", "contain", "content", "contest", "context", "contract", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "corridor", "cost", "cotton", "couch", "cough", "could", "council", "count", "counter", "country", "couple", "course", "court", "cousin", "cover", "coyote", "crack", "cradle", "craft", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "creep", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crowd", "crown", "crucial", "cruel", "cruise", "crumb", "crunch", "crush", "crust", "cry", "crystal", "cube", "cult", "cup", "curb", "curd", "cure", "curious", "curl", "current", "curse", "curtain", "curve", "cushion", "custom", "cut", "cycle", "cylinder"
];

export const MnemonicService = {
    generatePhrase() {
        const phrase = [];
        const crypto = window.crypto || window.msCrypto;
        const array = new Uint32Array(12);
        crypto.getRandomValues(array);

        for (let i = 0; i < 12; i++) {
            const randomIndex = array[i] % WORDLIST.length;
            phrase.push(WORDLIST[randomIndex]);
        }
        return phrase.join(' ');
    },

    phraseToKey(phrase) {
        // Deterministic normalization
        return phrase.trim().toLowerCase().replace(/\s+/g, ' ');
    },

    validatePhrase(phrase) {
        const words = phrase.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (words.length !== 12) return false;
        return words.every(word => WORDLIST.includes(word));
    }
};

export function isValidPin(pin) {
    return /^\d{6}$/.test(pin);
}
