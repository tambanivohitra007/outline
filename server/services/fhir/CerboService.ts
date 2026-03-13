import env from "@server/env";
import fetch from "@server/utils/fetch";

interface CerboPatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  dateOfBirth: string | null;
}

/**
 * Service for integrating with Cerbo EHR API.
 */
export default class CerboService {
  /**
   * Fetch a patient by their external ID from Cerbo.
   *
   * @param patientId The Cerbo patient ID.
   * @returns Patient data or null.
   */
  static async getPatient(patientId: string): Promise<CerboPatient | null> {
    const apiUrl = env.CERBO_API_URL;
    const apiKey = env.CERBO_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error("Cerbo EHR integration is not configured");
    }

    const response = await fetch(`${apiUrl}/patients/${patientId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Cerbo API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id ?? patientId,
      firstName: data.first_name ?? "",
      lastName: data.last_name ?? "",
      email: data.email ?? null,
      dateOfBirth: data.date_of_birth ?? null,
    };
  }

  /**
   * Search for patients in Cerbo.
   *
   * @param query Search query (name or email).
   * @returns Array of matching patients.
   */
  static async searchPatients(query: string): Promise<CerboPatient[]> {
    const apiUrl = env.CERBO_API_URL;
    const apiKey = env.CERBO_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error("Cerbo EHR integration is not configured");
    }

    const response = await fetch(
      `${apiUrl}/patients?search=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Cerbo API error: ${response.status}`);
    }

    const data = await response.json();
    const patients = data.data ?? data.patients ?? [];

    return patients.map((p: Record<string, string>) => ({
      id: p.id ?? "",
      firstName: p.first_name ?? "",
      lastName: p.last_name ?? "",
      email: p.email ?? null,
      dateOfBirth: p.date_of_birth ?? null,
    }));
  }
}
