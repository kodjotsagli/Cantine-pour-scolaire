import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types';
import { isSupabaseConfigured } from '../../db/supabaseClient';
import { Cloud, Lock, Mail, User, Building2, MapPin, Phone, AlertCircle, CheckCircle2, School } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings?: () => void;
  onSuccessNavigateToDashboard?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onNavigateToSettings,
  onSuccessNavigateToDashboard 
}) => {
  const { signInWithEmail, signUpWithNewSchool, signUpWithExistingSchool, fetchSchoolsList } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [signupMode, setSignupMode] = useState<'new_school' | 'join_school'>('new_school');

  // Common user fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('agent');

  // New school fields
  const [schoolNameInput, setSchoolNameInput] = useState('');
  const [schoolAddressInput, setSchoolAddressInput] = useState('');
  const [schoolPhoneInput, setSchoolPhoneInput] = useState('');

  // Existing school selection
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [availableSchools, setAvailableSchools] = useState<Array<{ id: string; name: string; address?: string }>>([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (tab === 'signup' && isConfigured) {
      fetchSchoolsList().then((list) => {
        setAvailableSchools(list);
        if (list.length > 0 && !selectedSchoolId) {
          setSelectedSchoolId(list[0].id);
        }
      });
    }
  }, [tab, isConfigured]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setLoading(true);
    setError('');
    const res = await signInWithEmail(email, password);
    setLoading(false);

    if (res.success) {
      setSuccess('Connexion réussie ! Vos données sont synchronisées.');
      setTimeout(() => {
        onClose();
        setSuccess('');
        if (onSuccessNavigateToDashboard) {
          onSuccessNavigateToDashboard();
        }
      }, 800);
    } else {
      setError(res.error || 'Identifiants incorrects.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setLoading(true);
    setError('');

    let res: { success: boolean; error?: string };

    if (signupMode === 'new_school') {
      if (!schoolNameInput.trim()) {
        setError("Veuillez renseigner le nom de l'établissement scolaire.");
        setLoading(false);
        return;
      }
      res = await signUpWithNewSchool({
        email,
        pass: password,
        fullName,
        schoolName: schoolNameInput.trim(),
        address: schoolAddressInput.trim(),
        phone: schoolPhoneInput.trim()
      });
    } else {
      if (!selectedSchoolId) {
        setError('Veuillez sélectionner votre école.');
        setLoading(false);
        return;
      }
      const schoolObj = availableSchools.find(s => s.id === selectedSchoolId);
      res = await signUpWithExistingSchool({
        email,
        pass: password,
        fullName,
        role,
        schoolId: selectedSchoolId,
        schoolName: schoolObj ? schoolObj.name : 'École'
      });
    }

    setLoading(false);

    if (res.success) {
      setSuccess(
        signupMode === 'new_school'
          ? `Établissement « ${schoolNameInput.trim()} » créé avec succès ! Ouverture du tableau de bord...`
          : 'Compte créé avec succès ! Bienvenue dans votre école.'
      );
      setTimeout(() => {
        onClose();
        setSuccess('');
        if (onSuccessNavigateToDashboard) {
          onSuccessNavigateToDashboard();
        }
      }, 900);
    } else {
      setError(res.error || 'Erreur lors de la création du compte.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connexion Cloud Multi-Appareils">
      <div className="space-y-4">
        {!isConfigured ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
              <Cloud className="w-4 h-4 text-amber-600" />
              Serveur Cloud non encore configuré
            </div>
            <p>
              Pour connecter plusieurs smartphones ou ordinateurs ensemble, vous devez renseigner vos clés Supabase dans les <strong>Paramètres</strong>.
            </p>
            <div className="pt-1 flex gap-2">
              {onNavigateToSettings && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                  onClick={() => {
                    onClose();
                    onNavigateToSettings();
                  }}
                >
                  Configurer dans les Paramètres
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={onClose} className="text-xs">
                Continuer en mode local
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); }}
                className={`flex-1 py-2.5 border-b-2 transition-all ${
                  tab === 'login'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Se Connecter
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); setError(''); }}
                className={`flex-1 py-2.5 border-b-2 transition-all ${
                  tab === 'signup'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Créer un Compte
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <Input
                  label="Adresse Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: directeur@ecole.tg"
                  icon={<Mail className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Mot de passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" disabled={loading} className="font-bold">
                    {loading ? 'Connexion...' : 'Se Connecter'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-3.5">
                {/* Signup Mode Selector */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setSignupMode('new_school'); setError(''); }}
                    className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      signupMode === 'new_school'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Nouvelle École</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSignupMode('join_school'); setError(''); }}
                    className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      signupMode === 'join_school'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <School className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Rejoindre École</span>
                  </button>
                </div>

                {signupMode === 'new_school' ? (
                  <>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                      <strong>Espace Directeur :</strong> créez votre établissement scolaire. 8 classes (Section 1 à CM2) et un espace de gestion étanche seront initialisés automatiquement.
                    </div>

                    <Input
                      label="Nom de l'Établissement"
                      value={schoolNameInput}
                      onChange={(e) => setSchoolNameInput(e.target.value)}
                      placeholder="ex: Complexe Scolaire Saint-Joseph"
                      icon={<Building2 className="w-4 h-4 text-emerald-600" />}
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Ville / Adresse"
                        value={schoolAddressInput}
                        onChange={(e) => setSchoolAddressInput(e.target.value)}
                        placeholder="ex: Lomé, Togo"
                        icon={<MapPin className="w-4 h-4" />}
                      />
                      <Input
                        label="Téléphone École"
                        value={schoolPhoneInput}
                        onChange={(e) => setSchoolPhoneInput(e.target.value)}
                        placeholder="ex: +228 90 00 00 00"
                        icon={<Phone className="w-4 h-4" />}
                      />
                    </div>

                    <Input
                      label="Nom du Directeur"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ex: M. KODJO Kokou"
                      icon={<User className="w-4 h-4" />}
                      required
                    />
                  </>
                ) : (
                  <>
                    <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800">
                      <strong>Personnel de cantine :</strong> choisissez votre école pour rejoindre votre équipe.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        Sélectionner votre École
                      </label>
                      {availableSchools.length > 0 ? (
                        <select
                          value={selectedSchoolId}
                          onChange={(e) => setSelectedSchoolId(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          required
                        >
                          {availableSchools.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.address ? `(${s.address})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-xl border border-slate-200">
                          Chargement des écoles disponibles...
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        Votre Rôle
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="manager">Responsable Cantine (Pointage, Dépôts, Rapports)</option>
                        <option value="agent">Agent de Pointage (Pointage quotidien)</option>
                      </select>
                    </div>

                    <Input
                      label="Nom & Prénom"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ex: Mme AKOSSIWA Marie"
                      icon={<User className="w-4 h-4" />}
                      required
                    />
                  </>
                )}

                <Input
                  label="Adresse Email de connexion"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: utilisateur@cantine.tg"
                  icon={<Mail className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Mot de passe (6 caractères min.)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  required
                />

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" disabled={loading} className="font-bold">
                    {loading ? 'Création...' : signupMode === 'new_school' ? 'Créer l\'établissement' : 'Rejoindre l\'école'}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
