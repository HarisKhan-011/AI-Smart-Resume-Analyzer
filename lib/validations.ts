export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateResumeFile(file: File): ValidationResult {
  const errors: string[] = [];
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (!file) {
    errors.push('File is required');
  } else if (!allowedTypes.includes(file.type)) {
    errors.push('Only PDF and Word documents are allowed');
  } else if (file.size > 5 * 1024 * 1024) { // 5MB
    errors.push('File size must be less than 5MB');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
