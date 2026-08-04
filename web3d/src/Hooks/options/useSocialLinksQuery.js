import { useQuery } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

const fetchSocialLinks = async (userId) => {
  const response = await privateAgent.get(
    routesName.AuthRoute({}).socialLinks.list(userId)
  );
  return response.data.data || [];
};

export const useSocialLinksQuery = (userId) => {
  return useQuery({
    queryKey: ["socialLinks", userId],
    queryFn: () => fetchSocialLinks(userId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};
