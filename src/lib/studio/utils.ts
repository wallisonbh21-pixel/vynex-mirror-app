export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getGoogleMapsUrl = (address: string) => {
  if (!address) return '#';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

export const getWhatsAppUrl = (phone: string, message: string) => {
  if (!phone) return '#';
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
