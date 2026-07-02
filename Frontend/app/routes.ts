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
    "/vote/:electionId",
    "routes/vote/portal.tsx"
  ),
  route(
    "/vote/:electionId/otp",
    "routes/vote/otp.tsx"
  ),
  route(
    "/vote/:electionId/ballot",
    "routes/vote/ballot.tsx"
  ),
  route(
    "/vote/:electionId/receipt",
    "routes/vote/receipt.tsx"
  ),

  route(
    "/admin",
    "routes/admin.tsx",
    [
      route("", "routes/admin/dashboard.tsx"),
      route("users", "routes/admin/voters.tsx"),
      route("elections", "routes/admin/elections.tsx"),
      route("snapshots", "routes/admin/snapshots.tsx"),
      route("settings", "routes/admin/settings.tsx"),
    ]
  ),

  route(
    "/officer",
    "routes/officer.tsx",
    [
      route("", "routes/officer/dashboard.tsx"),
      route("elections", "routes/officer/elections.tsx"),
      route("live-results", "routes/officer/results.tsx"),
      route(
        "election/:electionId",
        "routes/officer/election.tsx",
        [
          route("", "routes/officer/election/overview.tsx"),
          route("configuration", "routes/officer/election/configuration.tsx"),
          route("candidates", "routes/officer/election/candidates.tsx"),
          route("voter-snapshot", "routes/officer/election/voter-snapshot.tsx"),
          route("voters", "routes/officer/election/voters.tsx"),
          route("lifecycle", "routes/officer/election/lifecycle.tsx"),
          route("results", "routes/officer/election/results.tsx"),
        ]
      ),
      route("create-election", "routes/officer/create-election.tsx"),
    ]
  ),

  route(
    "/auditor",
    "routes/auditor.tsx",
    [
      route("", "routes/auditor/dashboard.tsx"),
      route("logs", "routes/auditor/logs.tsx"),
      route("reports", "routes/auditor/reports.tsx"),
    ]
  ),

  route(
    "/unauthorized",
    "routes/unauthorized.tsx"
  ),

  route("/observer", "routes/observer/results.tsx"),
  route("/observer/results", "routes/observer/results-redirect.tsx"),
  route("/observer/:electionId", "routes/observer/election-redirect.tsx"),
] satisfies RouteConfig;