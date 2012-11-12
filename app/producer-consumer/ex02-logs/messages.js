module.exports = [
  {
    key: "logs.system.info",
    payload: { code: 1, message: "System starting!" }
  },
  {
    key: "system.node.query",
    payload: { code: 700, message: "Query engine starting", args: ["x09ef34"] }
  },
  {
    key: "system.node.query",
    payload: { code: 703, message: "Query engine indexing", args: ["x09ef34"] }
  },
  {
    key: "system.node.query",
    payload: { code: 701, message: "Query engine up and running", args: ["x09ef34"] }
  },
  {
    key: "logs.user.info",
    payload: { code: 203, message: "User logged in", args: ["Carmen"] }
  },
  {
    key: "user.profile",
    payload: { code: 220, message: "User notification sent", args: ["Carmen", "x1ab23f"] }
  },
  {
    key: "logs.user.info",
    payload: { code: 209, message: "User profile changed", args: ["Carmen"] }
  },
  {
    key: "logs.query.info",
    payload: { code: 403, message: "User's orders history queried", args: ["Carmen"] }
  },
  {
    key: "logs.user.info",
    payload: { code: 203, message: "User logged in", args: ["Vlad"] }
  },
  {
    key: "logs.system.error",
    payload: { code: 109, message: "Query engine crashed", args: ["x09ef34"] }
  },
  {
    key: "logs.system.info",
    payload: { code: 111, message: "Query node starting", args: ["x28ab12"] }
  },
  {
    key: "logs.system.warning",
    payload: { code: 607, message: "Memory usage maximum threshold reached", args: ["7444", "8048"] }
  },
  {
    key: "logs.system.critical",
    payload: { code: 610, message: "Memory usage is running low", args: ["8000", "8048"] }
  }
];