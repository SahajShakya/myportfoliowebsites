import { useMutation, useQueryClient } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useCreateAcademicProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => privateAgent.post(routesName.AcademicProjectsRoute({}).create, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic_projects"] }),
  });
};

export const useUpdateAcademicProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => privateAgent.put(routesName.AcademicProjectsRoute({ id }).update, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic_projects"] }),
  });
};

export const useDeleteAcademicProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => privateAgent.delete(routesName.AcademicProjectsRoute({ id }).delete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic_projects"] }),
  });
};
