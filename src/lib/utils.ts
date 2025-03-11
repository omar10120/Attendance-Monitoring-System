export function validatePhoneNumber(phone: string): { isValid: boolean; formattedNumber: string } {
  // Remove all non-digit characters except + sign
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  // Check if the number starts with + and has between 11 and 15 digits
  const isValid = /^\+\d{11,15}$/.test(cleaned);
  
  return {
    isValid,
    formattedNumber: cleaned,
  };
}

export function formatTimeLeft(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
