import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useCvsData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.AuthRoute({}).cvs.list);
      const result = response.data.data || [];
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching CVs:", err);
      setError("Failed to fetch CVs");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, fetchAll };
};

export const uploadCv = async (payload) => {
  const response = await privateAgent.post(routesName.AuthRoute({}).cvs.upload, payload);
  return response.data;
};

export const updateCv = async (id, payload) => {
  const response = await privateAgent.put(routesName.AuthRoute({}).cvs.update(id), payload);
  return response.data;
};

export const deleteCv = async (id) => {
  const response = await privateAgent.delete(routesName.AuthRoute({}).cvs.delete(id));
  return response.data;
};
