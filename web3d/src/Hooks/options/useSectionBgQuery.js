import { useQuery } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useSectionBgQuery = (sectionKey) => {
  return useQuery({
    queryKey: ["sectionBg", sectionKey],
    queryFn: async () => {
      const response = await privateAgent.get(
        routesName.SettingsRoute().sectionBgImage(sectionKey)
      );
      return response.data.data?.value || null;
    },
    staleTime: 600000,
    gcTime: 1800000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};
