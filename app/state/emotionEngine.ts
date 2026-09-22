const emotionKeywords: Record<string, string[]> = {
  stressed: ["stress", "stressed", "pressure", "panic", "anxious", "anxiety"],
  frustrated: ["frustrated", "frustration", "angry", "annoyed", "revenge", "failed"],
  tired: ["tired", "exhausted", "sleepy", "drained", "fatigue"],
  overwhelmed: ["overwhelmed", "too much", "can't cope", "cannot cope", "confused"],
  motivated: ["motivated", "ready", "let's go", "excited", "determined"],
  confident: ["confident", "proud", "strong", "sure", "winning"],
  disciplined: ["disciplined", "consistent", "followed my plan", "stuck to"],
  focused: ["focused", "concentrating", "clear", "deep work", "locked in"],
  distracted: ["distracted", "scrolling", "procrastinating", "can't focus", "cannot focus"],
  calm: ["calm", "peaceful", "relaxed", "steady", "okay", "fine"],
};

export function detectEmotionFromMessage(message: string) {
  const normalized = message.toLowerCase();
  let bestEmotion = "calm";
  let bestScore = 0;

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    const score = keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      bestEmotion = emotion;
      bestScore = score;
    }
  }

  const intensity = Math.min(100, 35 + bestScore * 20 + (/[!?]{2,}/.test(message) ? 15 : 0));
  return { emotion: bestEmotion, intensity };
}