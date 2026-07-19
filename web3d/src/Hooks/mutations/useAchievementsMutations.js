import { useMutation, useQueryClient } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useCreateAchievement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => privateAgent.post(routesName.AchievementsRoute({}).create, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["achievements"] }),
  });
};

export const useUpdateAchievement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => privateAgent.put(routesName.AchievementsRoute({ id }).update, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["achievements"] }),
  });
};

export const useDeleteAchievement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => privateAgent.delete(routesName.AchievementsRoute({ id }).delete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["achievements"] }),
  });
};
