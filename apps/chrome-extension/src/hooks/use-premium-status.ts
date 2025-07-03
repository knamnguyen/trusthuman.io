import { useUserData } from "./use-user-data";

export const usePremiumStatus = () => {
  const { data: userData, isLoading } = useUserData();

  const accessType = userData?.accessType ?? null;

  const isPremium = accessType ? !["FREE"].includes(accessType) : false;

  return {
    isPremium,
    isLoading,
    accessType,
  };
};
