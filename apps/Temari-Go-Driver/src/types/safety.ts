export type AlcoholTestResult = {
  testId: number;
  passed: boolean;
  alcohol_level: number;
  threshold: number;
  message: string;
};
