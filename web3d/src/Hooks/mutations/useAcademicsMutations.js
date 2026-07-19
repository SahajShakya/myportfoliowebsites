import { useMutation, useQueryClient } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useCreateAcademic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => privateAgent.post(routesName.AcademicsRoute({}).create, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academics"] }),
  });
};

export const useUpdateAcademic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => privateAgent.put(routesName.AcademicsRoute({ id }).update, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academics"] }),
  });
};

export const useDeleteAcademic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => privateAgent.delete(routesName.AcademicsRoute({ id }).delete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academics"] }),
  });
};
