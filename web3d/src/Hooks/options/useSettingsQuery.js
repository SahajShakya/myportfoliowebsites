import { useQuery } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

const fetchAboutBg = async () => {
  const response = await privateAgent.get(
    routesName.SettingsRoute().aboutBgImage
  );
  return response.data.data || null;
};

export const useAboutBgQuery = () => {
  return useQuery({
    queryKey: ["aboutBgImage"],
    queryFn: fetchAboutBg,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};

const fetchCvActive = async () => {
  const response = await privateAgent.get(routesName.SettingsRoute().cvActive);
  return response.data.data || null;
};

export const useCvActiveQuery = () => {
  return useQuery({
    queryKey: ["cvActive"],
    queryFn: fetchCvActive,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};

const fetchMaterialsUrl = async () => {
  const response = await privateAgent.get(
    routesName.SettingsRoute().materialsUrl
  );
  return response.data.data || null;
};

export const useMaterialsUrlQuery = () => {
  return useQuery({
    queryKey: ["materialsUrl"],
    queryFn: fetchMaterialsUrl,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};
