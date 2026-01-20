import parsePhoneNumberFromString from 'libphonenumber-js';
import AppError from '../errorHelpers/AppError';

export const validatePhone = (phone: string) => {
  const phoneNumber = parsePhoneNumberFromString(phone);
  if (!phoneNumber || !phoneNumber.isValid()) {
    throw new AppError(400, 'Invalid phone number');
  }

  return phoneNumber.format('E.164'); // normalized format
};
