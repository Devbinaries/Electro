import type { ElectionStatus } from "~/types/election";

export const canEditElection = (status: ElectionStatus) => status === "draft";

export const canManageCandidates = (status: ElectionStatus) => status === "draft";

export const canManagePositions = (status: ElectionStatus) => status === "draft";

export const canImportVoters = (status: ElectionStatus) => status === "draft";

export const canManageVoters = (status: ElectionStatus) => status === "draft";

export const canActivateElection = (status: ElectionStatus) => status === "scheduled" || status === "locked";

export const canCloseElection = (status: ElectionStatus) => status === "active";

export const canLockElection = (status: ElectionStatus) => status === "draft";

export const isReadOnlyElection = (status: ElectionStatus) =>
  status === "scheduled" || status === "locked" || status === "active" || status === "completed";

export type ElectionTab = {
  name: string;
  path: string;
  key: string;
};

const ALL_TABS: ElectionTab[] = [
  { name: "Overview", path: ".", key: "overview" },
  { name: "Configuration", path: "configuration", key: "configuration" },
  { name: "Candidates", path: "candidates", key: "candidates" },
  { name: "Voter Snapshot", path: "voter-snapshot", key: "voter-snapshot" },
  { name: "Lifecycle", path: "lifecycle", key: "lifecycle" },
  { name: "Results", path: "results", key: "results" },
];

export const getVisibleElectionTabs = (status: ElectionStatus): ElectionTab[] => {
  switch (status) {
    case "draft":
      return ALL_TABS;
    case "scheduled":
    case "locked":
      return ALL_TABS.filter((tab) =>
        ["overview", "configuration", "lifecycle", "results"].includes(tab.key)
      );
    case "active":
      return ALL_TABS.filter((tab) =>
        ["overview", "lifecycle", "results"].includes(tab.key)
      );
    case "completed":
      return ALL_TABS.filter((tab) => ["overview", "results"].includes(tab.key));
    default:
      return ALL_TABS.filter((tab) => tab.key === "overview");
  }
};

export const buildPortalUrl = (path: string) => {
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
};
