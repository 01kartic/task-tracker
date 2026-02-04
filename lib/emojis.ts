let cachedData: Record<string, any[]> | null = null;

export async function emojiData() {
  if (cachedData) return cachedData;

  const response = await fetch("https://cdn.jsdelivr.net/npm/@emoji-mart/data");
  const data = await response.json();

  const result: Record<string, any[]> = {};
  data.categories.forEach((cat: any) => {
    result[cat.id] = cat.emojis.map((id: string) => data.emojis[id]);
  });

  cachedData = result;
  return cachedData;
}