import { ApiResponse, PaginatedData, WrappedResponse } from "@/types/api";

/**
 * Robustly extracts data from various API response formats (Direct, Paginated, or Wrapped).
 * @param res The API response data
 * @returns The extracted array of items or the item itself
 */
export function extractApiResponseData<T>(res: ApiResponse<T>): T {
  // If it's the direct data array or object
  if (Array.isArray(res)) return res as unknown as T;

  // If it's a PaginatedData<T>
  if (res && typeof res === "object" && "results" in res) {
    return (res as PaginatedData<T>).results;
  }

  // If it's a WrappedResponse<T>
  if (res && typeof res === "object" && "status" in res && "data" in res) {
    const innerData = (res as WrappedResponse<T>).data;

    // Handle nested pagination within a wrapper
    if (innerData && typeof innerData === "object" && "results" in innerData) {
      return (innerData as PaginatedData<T>).results;
    }

    return innerData as T;
  }

  // Fallback if structure is unexpected but might be the data itself
  return res as T;
}

/**
 * Specifically extracts an array from an API response, ensuring a fallback empty array.
 */
export function extractApiArray<T>(res: ApiResponse<T[]>): T[] {
  const data = extractApiResponseData(res);
  return Array.isArray(data) ? data : [];
}
