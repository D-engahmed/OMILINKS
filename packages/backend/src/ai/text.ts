/**
 * Lexical text handling for mixed Arabic/English support content.
 *
 * These are retrieval heuristics, not linguistics: they make common Arabic
 * spelling variants match each other and nothing more. Dialect handling
 * (Egyptian vs Gulf vs MSA) and Arabizi are NOT solved here; measure with
 * evaluateRetrieval() on real questions before trusting any of it.
 */

const STOPWORDS = new Set([
  // English
  "a", "an", "the", "is", "are", "was", "were", "do", "does", "did", "can",
  "could", "i", "my", "me", "we", "you", "your", "to", "of", "and", "or", "in",
  "on", "for", "how", "what", "when", "where", "it", "this", "that", "with",
  "be", "have", "has", "at", "by", "from", "please", "if",
  // Arabic (post-normalization spellings), incl. common Egyptian function words
  "في", "من", "علي", "الي", "عن", "هل", "ما", "ماذا", "كيف", "متي", "اين",
  "هو", "هي", "ان", "او", "لا", "انا", "انت", "ايه", "ازاي", "فين", "امتي",
  "ده", "دي", "دا", "ليه", "عشان", "لو", "يعني", "مع", "بس", "هذا", "هذه",
])

const ARABIC_PREFIXES = ["وال", "بال", "كال", "فال", "لل", "ال"]
const ARABIC_SUFFIXES = ["ات", "ين", "ون"]

export function normalizeText(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // harakat, dagger alef, tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
}

function stem(token: string): string {
  if (/^\p{Script=Arabic}+$/u.test(token)) {
    for (const prefix of ARABIC_PREFIXES) {
      if (token.startsWith(prefix) && token.length - prefix.length >= 3) {
        token = token.slice(prefix.length)
        break
      }
    }

    for (const suffix of ARABIC_SUFFIXES) {
      if (token.endsWith(suffix) && token.length - suffix.length >= 3) {
        token = token.slice(0, -suffix.length)
        break
      }
    }

    return token
  }

  if (/^[a-z]+$/.test(token) && token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1)
  }

  return token
}

export function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0 && !STOPWORDS.has(token))
    .map(stem)
    .filter((token) => token.length > 0)
}

/*
 * Splits text into retrieval chunks on paragraph then sentence boundaries,
 * never exceeding maxChars. Deterministic, no overlap (kept simple on purpose).
 */

export function chunkText(content: string, maxChars = 800): string[] {
  const paragraphs = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0)

  const pieces: string[] = []

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChars) {
      pieces.push(paragraph)
      continue
    }

    let current = ""

    for (const sentence of paragraph.split(/(?<=[.!?؟۔])\s+/u)) {
      const parts: string[] = []
      for (let i = 0; i < sentence.length; i += maxChars) {
        parts.push(sentence.slice(i, i + maxChars))
      }

      for (const part of parts) {
        if (current.length > 0 && current.length + 1 + part.length > maxChars) {
          pieces.push(current)
          current = part
        } else {
          current = current.length > 0 ? current + " " + part : part
        }
      }
    }

    if (current.length > 0) pieces.push(current)
  }

  const chunks: string[] = []

  for (const piece of pieces) {
    const last = chunks[chunks.length - 1]

    if (last !== undefined && last.length + 2 + piece.length <= maxChars) {
      chunks[chunks.length - 1] = last + "\n\n" + piece
    } else {
      chunks.push(piece)
    }
  }

  return chunks
}

export function containsArabic(input: string): boolean {
  return /\p{Script=Arabic}/u.test(input)
}
