import { useMutation, useQueryClient } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useCreateJourney = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => privateAgent.post(routesName.JourneyRoute({}).create, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journey"] }),
  });
};

export const useUpdateJourney = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => privateAgent.put(routesName.JourneyRoute({ id }).update, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journey"] }),
  });
};

export const useDeleteJourney = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => privateAgent.delete(routesName.JourneyRoute({ id }).delete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journey"] }),
  });
};
