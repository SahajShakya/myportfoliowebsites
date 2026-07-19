import { useQuery } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

const fetchTestimonials = async () => {
  const response = await privateAgent.get(routesName.TestimonialsRoute({}).list);
  return response.data.data || [];
};

export const useTestimonialsQuery = () => {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: fetchTestimonials,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};
