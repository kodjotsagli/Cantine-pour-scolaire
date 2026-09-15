import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import type { UserRole } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from '../db/supabaseClient';
import { db } from '../db';
import { pullFromSupabase } from '../services/syncService';

interface AuthContextType {
  role: UserRole;
  userName: string;
  userEmail: string | null;
  schoolId: string;
  schoolName: string;
  isCloudConnected: boolean;
  setRole: (role: UserRole) => void;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signUpWithNewSchool: (params: {
    email: string;
    pass: string;
    fullName: string;
    schoolName: string;
    address?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signUpWithExistingSchool: (params: {
    email: string;
    pass: string;
    fullName: string;
    role: UserRole;
    schoolId: string;
    schoolName: string;
  }) => Promise<{ success: boolean; error?: string }>;
  fetchSchoolsList: () => Promise<Array<{ id: string; name: string; address?: string }>>;
  signOutUser: () => Promise<void>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  canManageSettings: boolean;
  canManageClasses: boolean;
  canDeleteOrRestore: boolean;
  canManageDeposits: boolean;
  canViewReports: boolean;
  canRecordMeals: boolean;
  canViewStudents: boolean;
  canAddStudents: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('cantine_role') as UserRole) || 'admin';
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('cantine_user_email');
  });
  const [userDisplayName, setUserDisplayName] = useState<string>(() => {
    return localStorage.getItem('cantine_user_name') || '';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(isSupabaseConfigured());

  const [schoolId, setSchoolIdState] = useState<string>(() => {
    return localStorage.getItem('cantine_school_id') || 'school-default-01';
  });
  const [schoolName, setSchoolNameState] = useState<string>(() => {
    return localStorage.getItem('cantine_school_name') || 'École Primaire La Référence';
  });

  const loadSchoolDataForUser = async (user: any) => {
    const client = getSupabaseClient();
    if (!client) return;

    let sId = user.user_metadata?.school_id as string;
    let sName = user.user_metadata?.school_name as string;

    if (!sId) {
      const { data: prof } = await client.from('profiles').select('school_id, role, full_name').eq('id', user.id).maybeSingle();
      if (prof?.school_id) sId = prof.school_id;
    }

    if (sId) {
      setSchoolIdState(sId);
      localStorage.setItem('cantine_school_id', sId);

      if (!sName) {
        const { data: sch } = await client.from('schools').select('name').eq('id', sId).maybeSingle();
        if (sch?.name) sName = sch.name;
      }

      if (sName) {
        setSchoolNameState(sName);
        localStorage.setItem('cantine_school_name', sName);
      }

      // Update local IndexedDB settings
      const currentSettings = await db.settings.toCollection().first();
      if (currentSettings) {
        await db.settings.update(currentSettings.id!, {
          school_id: sId,
          school_name: sName || currentSettings.school_name
        });
      }
    }
  };

  // Listen to Supabase Auth State
  useEffect(() => {
    const updateCloudState = () => {
      setIsCloudConnected(isSupabaseConfigured());
    };
    window.addEventListener('supabase-config-changed', updateCloudState);

    const client = getSupabaseClient();
    if (client) {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUserEmail(session.user.email || null);
          const metaRole = session.user.user_metadata?.role as UserRole;
          const metaName = session.user.user_metadata?.full_name as string;
          if (metaRole) setRoleState(metaRole);
          if (metaName) setUserDisplayName(metaName);
          loadSchoolDataForUser(session.user);
        }
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUserEmail(session.user.email || null);
          const metaRole = session.user.user_metadata?.role as UserRole;
          const metaName = session.user.user_metadata?.full_name as string;
          if (metaRole) {
            setRoleState(metaRole);
            localStorage.setItem('cantine_role', metaRole);
          }
          if (metaName) {
            setUserDisplayName(metaName);
            localStorage.setItem('cantine_user_name', metaName);
          }
          if (session.user.email) {
            localStorage.setItem('cantine_user_email', session.user.email);
          }
          loadSchoolDataForUser(session.user);
        } else {
          setUserEmail(null);
          localStorage.removeItem('cantine_user_email');
        }
      });

      return () => {
        subscription.unsubscribe();
        window.removeEventListener('supabase-config-changed', updateCloudState);
      };
    }

    return () => {
      window.removeEventListener('supabase-config-changed', updateCloudState);
    };
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('cantine_role', newRole);
  };

  const getUserName = (r: UserRole) => {
    if (userDisplayName) return userDisplayName;
    switch (r) {
      case 'admin': return 'Directeur / Administrateur';
      case 'manager': return 'Responsable Cantine';
      case 'agent': return 'Agent de Pointage';
    }
  };

  const fetchSchoolsList = async (): Promise<Array<{ id: string; name: string; address?: string }>> => {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
      const { data, error } = await client.from('schools').select('id, name, address').order('name');
      if (error) {
        console.warn('Erreur chargement écoles :', error);
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Serveur Cloud non configuré dans les Paramètres.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: pass
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUserEmail(data.user.email || null);
        const metaRole = data.user.user_metadata?.role as UserRole;
        if (metaRole) setRole(metaRole);
        await loadSchoolDataForUser(data.user);

        const sId = data.user.user_metadata?.school_id || localStorage.getItem('cantine_school_id');
        if (sId) {
          await pullFromSupabase(sId, true);
        }

        return { success: true };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur de connexion' };
    }
  };

  const signUpWithNewSchool = async (params: {
    email: string;
    pass: string;
    fullName: string;
    schoolName: string;
    address?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Serveur Cloud non configuré dans les Paramètres.' };
    }

    try {
      const generatedSchoolId = `sch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      
      // 1. Create School
      const { error: schoolError } = await client.from('schools').insert({
        id: generatedSchoolId,
        name: params.schoolName.trim(),
        address: params.address?.trim() || '',
        phone: params.phone?.trim() || '',
        meal_price: 400,
        currency: 'FCFA'
      });

      if (schoolError) {
        return { success: false, error: `Erreur création école : ${schoolError.message}` };
      }

      // 2. Create 8 Default Classes
      const defaultClassesForSchool = [
        { id: `cls-${generatedSchoolId}-sec1`, school_id: generatedSchoolId, name: 'Section 1', level: 'Maternelle', active: true },
        { id: `cls-${generatedSchoolId}-sec2`, school_id: generatedSchoolId, name: 'Section 2', level: 'Maternelle', active: true },
        { id: `cls-${generatedSchoolId}-cp1`, school_id: generatedSchoolId, name: 'CP1', level: 'Primaire', active: true },
        { id: `cls-${generatedSchoolId}-cp2`, school_id: generatedSchoolId, name: 'CP2', level: 'Primaire', active: true },
        { id: `cls-${generatedSchoolId}-ce1`, school_id: generatedSchoolId, name: 'CE1', level: 'Primaire', active: true },
        { id: `cls-${generatedSchoolId}-ce2`, school_id: generatedSchoolId, name: 'CE2', level: 'Primaire', active: true },
        { id: `cls-${generatedSchoolId}-cm1`, school_id: generatedSchoolId, name: 'CM1', level: 'Primaire', active: true },
        { id: `cls-${generatedSchoolId}-cm2`, school_id: generatedSchoolId, name: 'CM2', level: 'Primaire', active: true }
      ];

      await client.from('classes').insert(defaultClassesForSchool);

      // 3. Register Admin User
      const { data: authData, error: authError } = await client.auth.signUp({
        email: params.email.trim(),
        password: params.pass,
        options: {
          data: {
            full_name: params.fullName.trim(),
            role: 'admin',
            school_id: generatedSchoolId,
            school_name: params.schoolName.trim()
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      // 4. Create Profile
      if (authData.user) {
        await client.from('profiles').upsert({
          id: authData.user.id,
          school_id: generatedSchoolId,
          full_name: params.fullName.trim(),
          role: 'admin'
        });
      }

      // 5. Update local state
      setSchoolIdState(generatedSchoolId);
      setSchoolNameState(params.schoolName.trim());
      setRole('admin');
      setUserDisplayName(params.fullName.trim());
      setUserEmail(params.email.trim());
      localStorage.setItem('cantine_school_id', generatedSchoolId);
      localStorage.setItem('cantine_school_name', params.schoolName.trim());

      // 6. Reset local store and set initial school classes
      await db.students.clear();
      await db.meals.clear();
      await db.deposits.clear();
      await db.classes.clear();
      await db.classes.bulkAdd(defaultClassesForSchool.map(c => ({
        ...c,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));

      const currentSettings = await db.settings.toCollection().first();
      if (currentSettings) {
        await db.settings.update(currentSettings.id!, {
          school_id: generatedSchoolId,
          school_name: params.schoolName.trim(),
          address: params.address?.trim() || '',
          phone: params.phone?.trim() || ''
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur lors de la création de l\'école' };
    }
  };

  const signUpWithExistingSchool = async (params: {
    email: string;
    pass: string;
    fullName: string;
    role: UserRole;
    schoolId: string;
    schoolName: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Serveur Cloud non configuré dans les Paramètres.' };
    }

    try {
      const { data: authData, error: authError } = await client.auth.signUp({
        email: params.email.trim(),
        password: params.pass,
        options: {
          data: {
            full_name: params.fullName.trim(),
            role: params.role,
            school_id: params.schoolId,
            school_name: params.schoolName
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        await client.from('profiles').upsert({
          id: authData.user.id,
          school_id: params.schoolId,
          full_name: params.fullName.trim(),
          role: params.role
        });
      }

      setSchoolIdState(params.schoolId);
      setSchoolNameState(params.schoolName);
      setRole(params.role);
      setUserDisplayName(params.fullName.trim());
      setUserEmail(params.email.trim());
      localStorage.setItem('cantine_school_id', params.schoolId);
      localStorage.setItem('cantine_school_name', params.schoolName);

      const currentSettings = await db.settings.toCollection().first();
      if (currentSettings) {
        await db.settings.update(currentSettings.id!, {
          school_id: params.schoolId,
          school_name: params.schoolName
        });
      }

      // Reset and pull school's active data
      await db.students.clear();
      await db.meals.clear();
      await db.deposits.clear();
      await db.classes.clear();
      await pullFromSupabase(params.schoolId, true);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur lors de l\'inscription' };
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    fullName: string,
    newRole: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    return signUpWithExistingSchool({
      email,
      pass,
      fullName,
      role: newRole,
      schoolId: schoolId || 'school-default-01',
      schoolName: schoolName || 'École Primaire La Référence'
    });
  };

  const signOutUser = async (): Promise<void> => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut().catch(() => {});
    }
    setUserEmail(null);
    setUserDisplayName('');
    localStorage.removeItem('cantine_user_email');
    localStorage.removeItem('cantine_user_name');
  };

  const canManageSettings = role === 'admin';
  const canManageClasses = role === 'admin';
  const canDeleteOrRestore = role === 'admin';
  const canManageDeposits = role === 'admin' || role === 'manager';
  const canViewReports = role === 'admin' || role === 'manager';
  const canRecordMeals = true; // All roles can point
  const canViewStudents = true;
  const canAddStudents = role === 'admin' || role === 'manager';

  return (
    <AuthContext.Provider
      value={{
        role,
        userName: getUserName(role),
        userEmail,
        schoolId,
        schoolName,
        isCloudConnected,
        setRole,
        signInWithEmail,
        signUpWithEmail,
        signUpWithNewSchool,
        signUpWithExistingSchool,
        fetchSchoolsList,
        signOutUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        canManageSettings,
        canManageClasses,
        canDeleteOrRestore,
        canManageDeposits,
        canViewReports,
        canRecordMeals,
        canViewStudents,
        canAddStudents
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
