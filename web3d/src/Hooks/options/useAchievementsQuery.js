import { useQuery } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

const fetchAchievements = async () => {
  const response = await privateAgent.get(routesName.AchievementsRoute({}).list);
  return response.data.data || [];
};

export const useAchievementsQuery = () => {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: fetchAchievements,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};
