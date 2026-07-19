import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useAchievementsData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.AchievementsRoute({}).list);
      const result = response.data.data || [];
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching achievements:", err);
      setError("Failed to fetch achievements");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, fetchAll };
};

export const createAchievement = async (payload) => {
  const response = await privateAgent.post(routesName.AchievementsRoute({}).create, payload);
  return response.data;
};

export const updateAchievement = async (id, payload) => {
  const response = await privateAgent.put(routesName.AchievementsRoute({ id }).update, payload);
  return response.data;
};

export const deleteAchievement = async (id) => {
  const response = await privateAgent.delete(routesName.AchievementsRoute({ id }).delete);
  return response.data;
};
