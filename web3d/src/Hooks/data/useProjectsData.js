import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useProjectsData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.ProjectsRoute({}).list);
      const result = response.data.data || [];
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to fetch projects");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, fetchAll };
};

export const createProject = async (payload) => {
  const response = await privateAgent.post(routesName.ProjectsRoute({}).create, payload);
  return response.data;
};

export const updateProject = async (id, payload) => {
  const response = await privateAgent.put(routesName.ProjectsRoute({ id }).update, payload);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await privateAgent.delete(routesName.ProjectsRoute({ id }).delete);
  return response.data;
};
