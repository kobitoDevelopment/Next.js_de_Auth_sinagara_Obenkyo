export type User = {
  id: string;
  email: string;
  username: string;
  role: "admin" | "user";
};
export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
};
