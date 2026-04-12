import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:1111/api",
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original?._retry) {
            original._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                return Promise.reject(error);
            }

            try {
                const refreshRes = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    refreshToken,
                });
                localStorage.setItem('accessToken', refreshRes.data.accessToken);
                original.headers.Authorization = `Bearer ${refreshRes.data.accessToken}`;
                return api(original);
            } catch (refreshErr) {
                return Promise.reject(refreshErr);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
