const API_BASE = "";

export const routes = {
  auth: {
    login: `${API_BASE}/auth/login`,
    register: `${API_BASE}/auth/register`,
    logout: `${API_BASE}/auth/logout`,
    refresh: `${API_BASE}/auth/refresh`,
    me: `${API_BASE}/auth/me`,
    user: (id) => `${API_BASE}/auth/user/${id}`,
    profile: `${API_BASE}/auth/profile`,
    profileImage: `${API_BASE}/auth/profile-image`,
    materialsUrl: `${API_BASE}/auth/materials-url`,
    password: `${API_BASE}/auth/password`,
    roles: `${API_BASE}/auth/roles`,
  },
  socialLinks: {
    list: (userId) =>
      userId
        ? `${API_BASE}/auth/social-links/${userId}`
        : `${API_BASE}/auth/social-links`,
    create: `${API_BASE}/auth/social-links`,
    update: (id) => `${API_BASE}/auth/social-links/${id}`,
    delete: (id) => `${API_BASE}/auth/social-links/${id}`,
  },
  cvs: {
    list: `${API_BASE}/auth/cvs`,
    active: (userId) =>
      userId
        ? `${API_BASE}/auth/cv-active/${userId}`
        : `${API_BASE}/auth/cv-active`,
    upload: `${API_BASE}/auth/cvs`,
    update: (id) => `${API_BASE}/auth/cvs/${id}`,
    delete: (id) => `${API_BASE}/auth/cvs/${id}`,
  },
  academics: {
    list: `${API_BASE}/academics`,
    get: (id) => `${API_BASE}/academics/${id}`,
    create: `${API_BASE}/academics`,
    update: (id) => `${API_BASE}/academics/${id}`,
    delete: (id) => `${API_BASE}/academics/${id}`,
  },
  journey: {
    list: `${API_BASE}/journey`,
    get: (id) => `${API_BASE}/journey/${id}`,
    create: `${API_BASE}/journey`,
    update: (id) => `${API_BASE}/journey/${id}`,
    delete: (id) => `${API_BASE}/journey/${id}`,
  },
  projects: {
    list: `${API_BASE}/projects`,
    get: (id) => `${API_BASE}/projects/${id}`,
    details: (id) => `${API_BASE}/projects/${id}/details`,
    create: `${API_BASE}/projects`,
    update: (id) => `${API_BASE}/projects/${id}`,
    delete: (id) => `${API_BASE}/projects/${id}`,
  },
  achievements: {
    list: `${API_BASE}/achievements`,
    get: (id) => `${API_BASE}/achievements/${id}`,
    details: (id) => `${API_BASE}/achievements/${id}/details`,
    create: `${API_BASE}/achievements`,
    update: (id) => `${API_BASE}/achievements/${id}`,
    delete: (id) => `${API_BASE}/achievements/${id}`,
  },
  testimonials: {
    list: `${API_BASE}/testimonials`,
    get: (id) => `${API_BASE}/testimonials/${id}`,
    create: `${API_BASE}/testimonials`,
    update: (id) => `${API_BASE}/testimonials/${id}`,
    delete: (id) => `${API_BASE}/testimonials/${id}`,
  },
  photography: {
    list: `${API_BASE}/photography`,
    get: (id) => `${API_BASE}/photography/${id}`,
    create: `${API_BASE}/photography`,
    update: (id) => `${API_BASE}/photography/${id}`,
    delete: (id) => `${API_BASE}/photography/${id}`,
  },
  upload: `${API_BASE}/upload`,
};
