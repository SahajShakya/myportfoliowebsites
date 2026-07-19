import { useMutation, useQueryClient } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => privateAgent.post(routesName.ProjectsRoute({}).create, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => privateAgent.put(routesName.ProjectsRoute({ id }).update, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => privateAgent.delete(routesName.ProjectsRoute({ id }).delete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
};
