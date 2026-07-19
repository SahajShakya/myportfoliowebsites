import { useMutation, useQueryClient } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useCreatePhotography = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => privateAgent.post(routesName.PhotographyRoute({}).create, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photography"] }),
  });
};

export const useUpdatePhotography = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => privateAgent.put(routesName.PhotographyRoute({ id }).update, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photography"] }),
  });
};

export const useDeletePhotography = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => privateAgent.delete(routesName.PhotographyRoute({ id }).delete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["photography"] }),
  });
};
