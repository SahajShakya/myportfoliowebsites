import { useQuery } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

const fetchAcademicProjects = async () => {
  const response = await privateAgent.get(
    routesName.AcademicProjectsRoute({}).list
  );
  return response.data.data || [];
};

export const useAcademicProjectsQuery = () => {
  return useQuery({
    queryKey: ["academic_projects"],
    queryFn: fetchAcademicProjects,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};
