import { useMutation, useQueryClient } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useCreateTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => privateAgent.post(routesName.TestimonialsRoute({}).create, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["testimonials"] }),
  });
};

export const useUpdateTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => privateAgent.put(routesName.TestimonialsRoute({ id }).update, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["testimonials"] }),
  });
};

export const useDeleteTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => privateAgent.delete(routesName.TestimonialsRoute({ id }).delete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["testimonials"] }),
  });
};
