export const JOB_STATUSES = {
  LeadCreated: "LeadCreated",
  AssessmentDone: "AssessmentDone",
  ContractSigned: "ContractSigned",
  InitialDocumentationComplete: "InitialDocumentationComplete",
  HygienistAssigned: "HygienistAssigned",
  SwabCompletedLabSent: "SwabCompletedLabSent",
  LabResultsProtocolReady: "LabResultsProtocolReady",
  InsuranceNegotiation: "InsuranceNegotiation",
  InsurancePaidFirstCheck: "InsurancePaidFirstCheck",
  WorkInProgress: "WorkInProgress",
  WorkCompleted: "WorkCompleted",
  FinalCheckToAttorney: "FinalCheckToAttorney",
  ContractorPaidCaseClosed: "ContractorPaidCaseClosed",
  Canceled: "Canceled"
};

export const HUMAN_STATUSES = {
  [JOB_STATUSES.LeadCreated]: "Lead Created",
  [JOB_STATUSES.AssessmentDone]: "Assessment Complete",
  [JOB_STATUSES.ContractSigned]: "Contract Signed",
  [JOB_STATUSES.InitialDocumentationComplete]: "Documentation Complete",
  [JOB_STATUSES.HygienistAssigned]: "Hygienist Assigned",
  [JOB_STATUSES.SwabCompletedLabSent]: "Swab Sent to Lab",
  [JOB_STATUSES.LabResultsProtocolReady]: "Protocol Ready",
  [JOB_STATUSES.InsuranceNegotiation]: "In Negotiation",
  [JOB_STATUSES.InsurancePaidFirstCheck]: "Initial Payment Received",
  [JOB_STATUSES.WorkInProgress]: "Work In Progress",
  [JOB_STATUSES.WorkCompleted]: "Work Completed",
  [JOB_STATUSES.FinalCheckToAttorney]: "Final Settlement Received",
  [JOB_STATUSES.ContractorPaidCaseClosed]: "Case Closed",
  [JOB_STATUSES.Canceled]: "Canceled"
};

export const USER_ROLES = {
  CompanyAdmin: "CompanyAdmin",
  LocationAdmin: "LocationAdmin",
  SalesRep: "SalesRep",
  Hygienist: "Hygienist",
  Attorney: "Attorney",
  Contractor: "Contractor",
  Homeowner: "Homeowner"
};