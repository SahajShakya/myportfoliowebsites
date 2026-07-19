import { useMutation } from "@tanstack/react-query";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: (payload) => privateAgent.put(routesName.AuthRoute({}).profile, payload),
  });
};

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (payload) => privateAgent.put(routesName.AuthRoute({}).changePassword, payload),
  });
};

export const useUploadProfileImage = () => {
  return useMutation({
    mutationFn: (payload) => privateAgent.post(routesName.AuthRoute({}).profileImage, payload),
  });
};

export const useUpdateMaterialsUrl = () => {
  return useMutation({
    mutationFn: (payload) => privateAgent.put(routesName.AuthRoute({}).materialsUrl, payload),
  });
};
