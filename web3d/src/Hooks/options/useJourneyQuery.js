import { useQuery } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

const fetchJourney = async () => {
  const response = await privateAgent.get(routesName.JourneyRoute({}).list);
  return response.data.data || [];
};

export const useJourneyQuery = () => {
  return useQuery({
    queryKey: ["journey"],
    queryFn: fetchJourney,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};
