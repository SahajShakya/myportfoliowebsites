import { useQuery } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

const fetchCvs = async () => {
  const response = await privateAgent.get(routesName.AuthRoute({}).cvs.list);
  return response.data.data || [];
};

export const useCvsQuery = () => {
  return useQuery({
    queryKey: ["cvs"],
    queryFn: fetchCvs,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};
