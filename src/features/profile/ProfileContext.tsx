import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/PreferencesContext";
import { emptyProfile, type UserProfile } from "../../types/user";
import { loadProfile, persistProfile } from "./profileStorage";

type ProfileContextValue = {
  profile: UserProfile;
  ready: boolean;
  saving: boolean;
  storageError: boolean;
  saveProfile: (profile: UserProfile) => Promise<boolean>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let mounted = true;
    void loadProfile()
      .then((saved) => { if (mounted) setProfile(saved); })
      .catch(() => { if (mounted) setStorageError(true); })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  const saveProfile = useCallback(async (nextProfile: UserProfile) => {
    setSaving(true);
    setStorageError(false);
    try {
      await persistProfile(nextProfile);
      setProfile(nextProfile);
      return true;
    } catch {
      setStorageError(true);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const value = useMemo(() => ({ profile, ready, saving, storageError, saveProfile }), [profile, ready, saving, storageError, saveProfile]);
  if (!ready) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: "center", justifyContent: "center" } });
