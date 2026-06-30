import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  route("/", "routes/home.tsx"),

  route(
    "/auth/login",
    "routes/auth/login.tsx"
  ),

  route(
    "/voter/welcome",
    "routes/voter/welcome.tsx"
  ),
  route(
    "/voter/verify",
    "routes/voter/verify.tsx"
  ),
  route(
    "/voter/otp",
    "routes/voter/otp.tsx"
  ),
  route(
    "/voter/ballot",
    "routes/voter/ballot.tsx"
  ),
  route(
    "/voter/confirmation",
    "routes/voter/confirmation.tsx"
  ),
  route(
    "/voter/thank-you",
    "routes/voter/thank-you.tsx"
  ),

  route(
    "/admin",
    "routes/admin.tsx",
    [
      route(
        "dashboard",
        "routes/admin/dashboard.tsx"
      ),
      route(
        "voters",
        "routes/admin/voters.tsx"
      ),
      route(
        "snapshots",
        "routes/admin/snapshots.tsx"
      ),
      route(
        "settings",
        "routes/admin/settings.tsx"
      ),
    ]
  ),

  route(
    "/officer",
    "routes/officer.tsx",
    [
      route(
        "dashboard",
        "routes/officer/dashboard.tsx"
      ),

      route(
        "elections",
        "routes/officer/elections.tsx"
      ),

      route(
        "election/:electionId",
        "routes/officer/election.tsx",
        [
          route(
            "",
            "routes/officer/election/overview.tsx"
          ),
          route(
            "configuration",
            "routes/officer/election/configuration.tsx"
          ),
          route(
            "candidates",
            "routes/officer/election/candidates.tsx"
          ),
          route(
            "voter-snapshot",
            "routes/officer/election/voter-snapshot.tsx"
          ),
          route(
            "lifecycle",
            "routes/officer/election/lifecycle.tsx"
          ),
          route(
            "results",
            "routes/officer/election/results.tsx"
          ),
        ]
      ),
      route(
        "create-election",
        "routes/officer/create-election.tsx"
      ),
    ]
  ),

  route(
    "/auditor",
    "routes/auditor.tsx",
    [
      route(
        "dashboard",
        "routes/auditor/dashboard.tsx"
      ),
      route(
        "audits",
        "routes/auditor/audits.tsx"
      ),
      route(
        "logs",
        "routes/auditor/logs.tsx"
      ),
      route(
        "reports",
        "routes/auditor/reports.tsx"
      ),
    ]
  ),

  route(
    "/observer/results",
    "routes/observer/results.tsx"
  ),
] satisfies RouteConfig;