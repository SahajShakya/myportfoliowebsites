import { useMutation, useQueryClient } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useCreateSocialLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => privateAgent.post(routesName.AuthRoute({}).socialLinks.create, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["socialLinks"] }),
  });
};

export const useUpdateSocialLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => privateAgent.put(routesName.AuthRoute({}).socialLinks.update(id), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["socialLinks"] }),
  });
};

export const useDeleteSocialLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => privateAgent.delete(routesName.AuthRoute({}).socialLinks.delete(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["socialLinks"] }),
  });
};
