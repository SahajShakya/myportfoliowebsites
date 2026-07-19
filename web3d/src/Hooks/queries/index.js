import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";
import { routes } from "../../constants/routes";

export const useProfileQuery = (userId) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const data = await api.get(routes.auth.user(userId));
      return data.user;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

export const useSocialLinksQuery = (userId) => {
  return useQuery({
    queryKey: ["socialLinks", userId],
    queryFn: async () => {
      const data = await api.get(routes.socialLinks.list(userId));
      return data.data || [];
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
};

export const useCvsQuery = () => {
  return useQuery({
    queryKey: ["cvs"],
    queryFn: async () => {
      const data = await api.get(routes.cvs.list);
      return data.data || [];
    },
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
};

export const useProjectsQuery = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const data = await api.get(routes.projects.list);
      return data.data || [];
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
};

export const useAchievementsQuery = () => {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const data = await api.get(routes.achievements.list);
      return data.data || [];
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
};

export const useAcademicsQuery = () => {
  return useQuery({
    queryKey: ["academics"],
    queryFn: async () => {
      const data = await api.get(routes.academics.list);
      return data.data || [];
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
};

export const useJourneyQuery = () => {
  return useQuery({
    queryKey: ["journey"],
    queryFn: async () => {
      const data = await api.get(routes.journey.list);
      return data.data || [];
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
};

export const useTestimonialsQuery = () => {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const data = await api.get(routes.testimonials.list);
      return data.data || [];
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
};
