const HOST_URL = "";
const ROOT_ROUTE = "/api";
const BASE = "";

export const routesName = {
  AuthRoute({ id } = {}) {
    return {
      login: `${BASE}/auth/login`,
      logout: `${BASE}/auth/logout`,
      register: `${BASE}/auth/register`,
      me: `${BASE}/auth/me`,
      status: `${BASE}/auth/status`,
      refresh: `${BASE}/auth/refresh`,
      user: (userId) => `${BASE}/auth/user/${userId}`,
      profile: `${BASE}/auth/profile`,
      profileImage: `${BASE}/auth/profile-image`,
      aboutBgImage: `${BASE}/auth/about-bg-image`,
      sectionBgImage: (key) => `${BASE}/auth/section-bg-image/${key}`,
      deleteSectionBgImage: (key) => `${BASE}/auth/section-bg-image/${key}`,
      materialsUrl: `${BASE}/auth/materials-url`,
      changePassword: `${BASE}/auth/password`,
      roles: `${BASE}/auth/roles`,
      socialLinks: {
        list: (userId) =>
          userId
            ? `${BASE}/auth/social-links/${userId}`
            : `${BASE}/auth/social-links`,
        create: `${BASE}/auth/social-links`,
        update: (linkId) => `${BASE}/auth/social-links/${linkId}`,
        delete: (linkId) => `${BASE}/auth/social-links/${linkId}`,
      },
      cvs: {
        list: `${BASE}/auth/cvs`,
        active: (userId) =>
          userId
            ? `${BASE}/auth/cv-active/${userId}`
            : `${BASE}/auth/cv-active`,
        upload: `${BASE}/auth/cvs`,
        update: (cvId) => `${BASE}/auth/cvs/${cvId}`,
        delete: (cvId) => `${BASE}/auth/cvs/${cvId}`,
      },
    };
  },

  AcademicsRoute({ id } = {}) {
    return {
      list: `${BASE}/academics`,
      get: id ? `${BASE}/academics/${id}` : undefined,
      create: `${BASE}/academics`,
      update: id ? `${BASE}/academics/${id}` : undefined,
      delete: id ? `${BASE}/academics/${id}` : undefined,
    };
  },

  JourneyRoute({ id } = {}) {
    return {
      list: `${BASE}/journey`,
      get: id ? `${BASE}/journey/${id}` : undefined,
      create: `${BASE}/journey`,
      update: id ? `${BASE}/journey/${id}` : undefined,
      delete: id ? `${BASE}/journey/${id}` : undefined,
    };
  },

  ProjectsRoute({ id } = {}) {
    return {
      list: `${BASE}/projects`,
      get: id ? `${BASE}/projects/${id}` : undefined,
      details: id ? `${BASE}/projects/${id}/details` : undefined,
      create: `${BASE}/projects`,
      update: id ? `${BASE}/projects/${id}` : undefined,
      delete: id ? `${BASE}/projects/${id}` : undefined,
    };
  },

  AchievementsRoute({ id } = {}) {
    return {
      list: `${BASE}/achievements`,
      get: id ? `${BASE}/achievements/${id}` : undefined,
      details: id ? `${BASE}/achievements/${id}/details` : undefined,
      create: `${BASE}/achievements`,
      update: id ? `${BASE}/achievements/${id}` : undefined,
      delete: id ? `${BASE}/achievements/${id}` : undefined,
    };
  },

  TestimonialsRoute({ id } = {}) {
    return {
      list: `${BASE}/testimonials`,
      get: id ? `${BASE}/testimonials/${id}` : undefined,
      create: `${BASE}/testimonials`,
      update: id ? `${BASE}/testimonials/${id}` : undefined,
      delete: id ? `${BASE}/testimonials/${id}` : undefined,
    };
  },

  PhotographyRoute({ id } = {}) {
    return {
      list: `${BASE}/photography`,
      get: id ? `${BASE}/photography/${id}` : undefined,
      create: `${BASE}/photography`,
      update: id ? `${BASE}/photography/${id}` : undefined,
      delete: id ? `${BASE}/photography/${id}` : undefined,
    };
  },

  SettingsRoute() {
    return {
      aboutBgImage: `${BASE}/settings/about_bg_image`,
      sectionBgImage: (key) => `${BASE}/settings/${key}`,
      cvActive: `${BASE}/settings/cv-active`,
      materialsUrl: `${BASE}/settings/materials_url`,
      profileImage: `${BASE}/settings/profile_image`,
      activeCv: `${BASE}/settings/active_cv`,
    };
  },

  ContactRoute() {
    return {
      send: `${BASE}/contact`,
    };
  },

  ChatRoute({ sessionId } = {}) {
    return {
      message: `${BASE}/chat/message`,
      poll: (sid, after) => `${BASE}/chat/poll?session_id=${sid}&after=${after}`,
      history: sessionId ? `${BASE}/chat/history/${sessionId}` : undefined,
    };
  },

  KnowledgeRoute() {
    return {
      rebuild: `${BASE}/knowledge/rebuild`,
    };
  },

  UploadRoute() {
    return {
      upload: `${BASE}/upload`,
    };
  },
};
