export type FormData = {
  username: string;
  email: string;
  role: 'user' | 'admin';
  password: string;
};

export type FormErrors = {
  username: string;
  email: string;
  role: string;
  password: string;
};
