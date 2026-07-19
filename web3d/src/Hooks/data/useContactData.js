import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useContactData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (payload) => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.post(routesName.ContactRoute().send, payload);
      const result = response.data;
      setData(result);
      return result;
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, sendMessage };
};
