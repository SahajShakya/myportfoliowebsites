import { useQuery } from "react-query";
import api from "../../api/client";

const fetchActiveUser = async (uid) => {
  const data = await api.get(`/auth/active/${uid}`);
  if (data.user) {
    return data.user;
  }
  throw new Error("User not found");
};

export const useActiveUser = (uid) => {
  return useQuery(
    ["activeUser", uid],
    () => fetchActiveUser(uid),
    {
      enabled: !!uid,
      retry: false,
    }
  );
};
