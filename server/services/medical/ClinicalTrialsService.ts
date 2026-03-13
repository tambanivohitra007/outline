const CLINICAL_TRIALS_BASE_URL = "https://clinicaltrials.gov/api/v2";

interface ClinicalTrial {
  nctId: string;
  title: string;
  status: string;
  phase: string | null;
  conditions: string[];
  interventions: string[];
  startDate: string | null;
  completionDate: string | null;
}

/**
 * Service for interacting with the ClinicalTrials.gov v2 API.
 */
export default class ClinicalTrialsService {
  /**
   * Search for clinical trials by condition or keyword.
   *
   * @param query The search query (condition name or keyword).
   * @param limit Maximum results to return.
   * @returns Array of clinical trial summaries.
   */
  static async search(
    query: string,
    limit = 20
  ): Promise<ClinicalTrial[]> {
    const url = `${CLINICAL_TRIALS_BASE_URL}/studies?query.cond=${encodeURIComponent(query)}&pageSize=${limit}&format=json`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`ClinicalTrials.gov API error: ${response.status}`);
    }

    const data = await response.json();
    const studies = data.studies ?? [];

    return studies.map((study: Record<string, unknown>) => {
      const protocol = study.protocolSection as Record<string, unknown> ?? {};
      const id = (protocol.identificationModule as Record<string, unknown>) ?? {};
      const status = (protocol.statusModule as Record<string, unknown>) ?? {};
      const conditions = (protocol.conditionsModule as Record<string, unknown>) ?? {};
      const arms = (protocol.armsInterventionsModule as Record<string, unknown>) ?? {};
      const design = (protocol.designModule as Record<string, unknown>) ?? {};

      return {
        nctId: (id.nctId as string) ?? "",
        title: (id.briefTitle as string) ?? "",
        status: (status.overallStatus as string) ?? "",
        phase: ((design.phases as string[]) ?? []).join(", ") || null,
        conditions: (conditions.conditions as string[]) ?? [],
        interventions: ((arms.interventions as Array<Record<string, string>>) ?? []).map(
          (i) => i.name ?? ""
        ),
        startDate: (status.startDateStruct as Record<string, string>)?.date ?? null,
        completionDate: (status.completionDateStruct as Record<string, string>)?.date ?? null,
      };
    });
  }

  /**
   * Fetch a single clinical trial by NCT ID.
   *
   * @param nctId The NCT identifier.
   * @returns Trial details or null.
   */
  static async fetchTrial(nctId: string): Promise<ClinicalTrial | null> {
    const url = `${CLINICAL_TRIALS_BASE_URL}/studies/${nctId}?format=json`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`ClinicalTrials.gov API error: ${response.status}`);
    }

    const study = await response.json();
    const protocol = (study.protocolSection as Record<string, unknown>) ?? {};
    const id = (protocol.identificationModule as Record<string, unknown>) ?? {};
    const statusMod = (protocol.statusModule as Record<string, unknown>) ?? {};
    const condMod = (protocol.conditionsModule as Record<string, unknown>) ?? {};
    const arms = (protocol.armsInterventionsModule as Record<string, unknown>) ?? {};
    const design = (protocol.designModule as Record<string, unknown>) ?? {};

    return {
      nctId: (id.nctId as string) ?? nctId,
      title: (id.briefTitle as string) ?? "",
      status: (statusMod.overallStatus as string) ?? "",
      phase: ((design.phases as string[]) ?? []).join(", ") || null,
      conditions: (condMod.conditions as string[]) ?? [],
      interventions: ((arms.interventions as Array<Record<string, string>>) ?? []).map(
        (i) => i.name ?? ""
      ),
      startDate: (statusMod.startDateStruct as Record<string, string>)?.date ?? null,
      completionDate: (statusMod.completionDateStruct as Record<string, string>)?.date ?? null,
    };
  }
}
