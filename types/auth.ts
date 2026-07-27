
export type ProfileRole =
  | "customer"
  | "admin";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
};
