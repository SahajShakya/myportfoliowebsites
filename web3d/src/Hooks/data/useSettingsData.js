import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useSettingsData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAboutBgImage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.SettingsRoute().aboutBgImage);
      const result = response.data.data || null;
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching about background image:", err);
      setError("Failed to fetch about background image");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCvActive = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.SettingsRoute().cvActive);
      const result = response.data.data || null;
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching CV active:", err);
      setError("Failed to fetch CV active");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMaterialsUrl = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.SettingsRoute().materialsUrl);
      const result = response.data.data || null;
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching materials URL:", err);
      setError("Failed to fetch materials URL");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, fetchAboutBgImage, fetchCvActive, fetchMaterialsUrl };
};
