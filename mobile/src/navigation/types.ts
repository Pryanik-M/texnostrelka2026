export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  SubscriptionDetail: { subscriptionId: number };
  SubscriptionForm: { subscriptionId?: number; candidateId?: number; candidateName?: string } | undefined;
  ImportEmail: undefined;
  Forecast: undefined;
  Candidates: undefined;
};
