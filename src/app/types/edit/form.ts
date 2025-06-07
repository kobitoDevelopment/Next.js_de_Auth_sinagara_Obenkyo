export type FormData = {
  username: string;
  email: string;
  role: 'user' | 'admin';
  newPassword: string;
  currentPassword: string;
};

export type FormErrors = {
  username: string;
  email: string;
  role: string;
  newPassword: string;
  currentPassword: string;
};
