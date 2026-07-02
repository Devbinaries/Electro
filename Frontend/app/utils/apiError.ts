import type { AxiosError } from "axios";

const formatErrorValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatErrorValue(item)).join(", ");
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.missing_columns)) {
      return `Missing required columns: ${record.missing_columns.join(", ")}`;
    }

    return Object.entries(record)
      .map(([key, entry]) => `${key}: ${formatErrorValue(entry)}`)
      .join("; ");
  }

  return String(value);
};

export const getApiErrorMessage = (error: unknown, fallback = "Request failed.") => {
  const axiosError = error as AxiosError<{
    error?: unknown;
    detail?: unknown;
  }>;
  const data = axiosError.response?.data;

  if (!data) {
    return axiosError.message || fallback;
  }

  if (data.error !== undefined && data.error !== null) {
    return formatErrorValue(data.error);
  }

  if (data.detail !== undefined && data.detail !== null) {
    return formatErrorValue(data.detail);
  }

  return fallback;
};

export const getApiStatus = (error: unknown) => {
  return (error as AxiosError)?.response?.status;
};
