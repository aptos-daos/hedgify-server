export const generateInviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const wordLength = 4;
  const wordCount = 6;

  const generateWord = () =>
    Array.from(
      { length: wordLength },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");

  const code = Array.from({ length: wordCount }, generateWord).join("-");

  return code;
};
