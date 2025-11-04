// Utility function to generate unique voucher codes

export const generateVoucherCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  // Generate a 10-character random code (e.g., "FZK3Y7LQ9P")
  for (let i = 0; i < 10; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // Add a timestamp suffix to make collisions practically impossible
  return code + "-" + Date.now().toString().slice(-5);
};
