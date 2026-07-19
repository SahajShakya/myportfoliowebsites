import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useChatData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (message, sessionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.post(routesName.ChatRoute({}).message, {
        message,
        session_id: sessionId,
      });
      const result = response.data;
      setData(result);
      return result;
    } catch (err) {
      console.error("Error sending chat message:", err);
      setError("Failed to send chat message");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteHistory = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.delete(routesName.ChatRoute({ sessionId }).history);
      const result = response.data;
      return result;
    } catch (err) {
      console.error("Error deleting chat history:", err);
      setError("Failed to delete chat history");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, sendMessage, deleteHistory };
};
