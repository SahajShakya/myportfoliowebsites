import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useSocialLinksData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.AuthRoute({}).socialLinks.list(userId));
      const result = response.data.data || [];
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching social links:", err);
      setError("Failed to fetch social links");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, fetchAll };
};

export const createSocialLink = async (payload) => {
  const response = await privateAgent.post(routesName.AuthRoute({}).socialLinks.create, payload);
  return response.data;
};

export const updateSocialLink = async (id, payload) => {
  const response = await privateAgent.put(routesName.AuthRoute({}).socialLinks.update(id), payload);
  return response.data;
};

export const deleteSocialLink = async (id) => {
  const response = await privateAgent.delete(routesName.AuthRoute({}).socialLinks.delete(id));
  return response.data;
};
