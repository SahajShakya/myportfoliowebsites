import { useQuery } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

const fetchAcademics = async () => {
  const response = await privateAgent.get(routesName.AcademicsRoute({}).list);
  return response.data.data || [];
};

export const useAcademicsQuery = () => {
  return useQuery({
    queryKey: ["academics"],
    queryFn: fetchAcademics,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};
