export const PLAN_LIMITS = {
  free: { maxStudies: 1, maxUploadsPerStudy: 3, watermarkExports: true },
  researcher: { maxStudies: Infinity, maxUploadsPerStudy: Infinity, watermarkExports: false },
  lab: { maxStudies: Infinity, maxUploadsPerStudy: Infinity, watermarkExports: false },
};

export function limitsForPlan(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export function canCreateStudy(plan, currentStudyCount) {
  return currentStudyCount < limitsForPlan(plan).maxStudies;
}

export function canAddUpload(plan, currentUploadCount) {
  return currentUploadCount < limitsForPlan(plan).maxUploadsPerStudy;
}

export function shouldWatermark(plan) {
  return limitsForPlan(plan).watermarkExports;
}
