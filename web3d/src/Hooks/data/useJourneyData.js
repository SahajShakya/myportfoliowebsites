import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useJourneyData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.JourneyRoute({}).list);
      const result = response.data.data || [];
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching journey:", err);
      setError("Failed to fetch journey");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, fetchAll };
};

export const createJourney = async (payload) => {
  const response = await privateAgent.post(routesName.JourneyRoute({}).create, payload);
  return response.data;
};

export const updateJourney = async (id, payload) => {
  const response = await privateAgent.put(routesName.JourneyRoute({ id }).update, payload);
  return response.data;
};

export const deleteJourney = async (id) => {
  const response = await privateAgent.delete(routesName.JourneyRoute({ id }).delete);
  return response.data;
};
