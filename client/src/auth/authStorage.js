export const setAuth = ({ accessToken, refreshToken, user }) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("role", user.role);
  localStorage.setItem("userId", user.id);
  localStorage.setItem("fullName", user.fullName || "");
};

export const clearAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("fullName");
};

export const getRole = () => localStorage.getItem("role");
export const getFullName = () => localStorage.getItem("fullName");
export const hasToken = () => !!localStorage.getItem("accessToken");
