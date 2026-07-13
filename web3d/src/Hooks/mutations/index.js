import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { routes } from "../constants/routes";

export const useUpdateProfileMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put(routes.auth.profile, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useUploadProfileImageMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.postForm(routes.auth.profileImage, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: (payload) => api.put(routes.auth.password, payload),
  });
};

export const useCreateSocialLinkMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(routes.socialLinks.create, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["socialLinks"] });
    },
  });
};

export const useUpdateSocialLinkMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      api.put(routes.socialLinks.update(id), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["socialLinks"] });
    },
  });
};

export const useDeleteSocialLinkMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(routes.socialLinks.delete(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["socialLinks"] });
    },
  });
};

export const useUploadCvMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.postForm(routes.cvs.upload, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cvs"] });
    },
  });
};

export const useSetActiveCvMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      api.put(routes.cvs.update(id), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cvs"] });
    },
  });
};

export const useDeleteCvMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(routes.cvs.delete(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cvs"] });
    },
  });
};
