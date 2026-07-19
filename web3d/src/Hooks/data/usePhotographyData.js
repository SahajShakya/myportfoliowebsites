import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const usePhotographyData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.PhotographyRoute({}).list);
      const result = response.data.data || [];
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching photography:", err);
      setError("Failed to fetch photography");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, fetchAll };
};

export const createPhotography = async (payload) => {
  const response = await privateAgent.post(routesName.PhotographyRoute({}).create, payload);
  return response.data;
};

export const updatePhotography = async (id, payload) => {
  const response = await privateAgent.put(routesName.PhotographyRoute({ id }).update, payload);
  return response.data;
};

export const deletePhotography = async (id) => {
  const response = await privateAgent.delete(routesName.PhotographyRoute({ id }).delete);
  return response.data;
};
