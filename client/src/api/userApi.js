import api from "./axios";

export const getUsers = (role) => {
  const params = role ? { role } : {};
  return api.get("/users", { params });
};

export const getUserById = (id) => api.get(`/users/${id}`);
