import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useAcademicProjectsData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.AcademicProjectsRoute({}).list);
      const result = response.data.data || [];
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching academic projects:", err);
      setError("Failed to fetch academic projects");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, fetchAll };
};

export const createAcademicProject = async (payload) => {
  const response = await privateAgent.post(routesName.AcademicProjectsRoute({}).create, payload);
  return response.data;
};

export const updateAcademicProject = async (id, payload) => {
  const response = await privateAgent.put(routesName.AcademicProjectsRoute({ id }).update, payload);
  return response.data;
};

export const deleteAcademicProject = async (id) => {
  const response = await privateAgent.delete(routesName.AcademicProjectsRoute({ id }).delete);
  return response.data;
};
