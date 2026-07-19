import { useState, useCallback } from "react";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";

export const useTestimonialsData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(routesName.TestimonialsRoute({}).list);
      const result = response.data.data || [];
      setData(result);
      return result;
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      setError("Failed to fetch testimonials");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, setData, fetchAll };
};

export const createTestimonial = async (payload) => {
  const response = await privateAgent.post(routesName.TestimonialsRoute({}).create, payload);
  return response.data;
};

export const updateTestimonial = async (id, payload) => {
  const response = await privateAgent.put(routesName.TestimonialsRoute({ id }).update, payload);
  return response.data;
};

export const deleteTestimonial = async (id) => {
  const response = await privateAgent.delete(routesName.TestimonialsRoute({ id }).delete);
  return response.data;
};
