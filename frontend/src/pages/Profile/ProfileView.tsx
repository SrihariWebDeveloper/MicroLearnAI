import React, { useState } from 'react';
import { User as UserIcon, Mail, Shield, Target, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const ProfileView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);
    try {
      const updatedUser = await authApi.updateProfile({ full_name: fullName });
      updateUser(updatedUser);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-600/30">
          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">{user?.full_name}</h2>
          <p className="text-xs text-slate-400">{user?.email}</p>
          <Badge variant="indigo" size="sm" className="mt-1">
            Role: {user?.role || 'Learner'}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          {savedSuccess && (
            <div className="p-3.5 mb-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Profile details saved successfully.</span>
            </div>
          )}
          {saveError && (
            <div className="p-3.5 mb-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300">
              {saveError}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>

            <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
