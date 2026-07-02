import { adminLogin, clearToken, isAuthenticated } from "./api";

/** Rótulos exibidos no painel (não usados para autenticar — isso é 100% no servidor). */
export const ADMIN_PROFILE = {
  user: "admin",
  displayName: "Admin",
};

/** Authenticates against the API; stores the token on success. */
export function login(user: string, password: string): Promise<boolean> {
  return adminLogin(user, password);
}

export function logout() {
  clearToken();
}

export { isAuthenticated };
