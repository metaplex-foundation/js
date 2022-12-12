export const generateRandomString = (
  length = 20,
  alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
) => {
  let result = '';
  const alphabetLength = alphabet.length;
  for (var i = 0; i < length; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabetLength));
  }

  return result;
};
