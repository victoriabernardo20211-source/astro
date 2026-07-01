import { adminLogin, clearToken, isAuthenticated } from "./api";

/** Demo credentials prefilled on the login screen / shown in the panel. */
export const DEMO_CREDENTIALS = {
  user: "berlim",
  password: "123456",
  displayName: "BERLIM",
};

/** Authenticates against the API; stores the token on success. */
export function login(user: string, password: string): Promise<boolean> {
  return adminLogin(user, password);
}

export function logout() {
  clearToken();
}

export { isAuthenticated };
