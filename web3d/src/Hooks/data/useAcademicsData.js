import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useAcademicsData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.AcademicsRoute({}).list);
      const result = response.data.data || [];
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching academics:", err);
      setError("Failed to fetch academics");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, fetchAll };
};

export const createAcademic = async (payload) => {
  const response = await privateAgent.post(routesName.AcademicsRoute({}).create, payload);
  return response.data;
};

export const updateAcademic = async (id, payload) => {
  const response = await privateAgent.put(routesName.AcademicsRoute({ id }).update, payload);
  return response.data;
};

export const deleteAcademic = async (id) => {
  const response = await privateAgent.delete(routesName.AcademicsRoute({ id }).delete);
  return response.data;
};
