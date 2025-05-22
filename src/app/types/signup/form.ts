export type FormData = {
  username: string;
  email: string;
  role: "user" | "admin";
};

export type FormErrors = {
  username: string;
  email: string;
  role: string;
};
