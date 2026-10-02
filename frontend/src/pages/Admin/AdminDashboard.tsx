import React, { useEffect, useState } from 'react';
import { Shield, Users, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { AdminStatus, AdminUser, adminApi } from '../../api/admin';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextStatus, nextUsers] = await Promise.all([
        adminApi.getStatus(),
        adminApi.getUsers(),
      ]);
      setStatus(nextStatus);
      setUsers(nextUsers);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load administration data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const updateRole = async (userId: string, role: AdminUser['role']) => {
    try {
      await adminApi.updateRole(userId, role);
      setUsers((current) => current.map((user) => user.id === userId ? { ...user, role } : user));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update this account role.');
    }
  };

  if (isLoading) return <LoadingState message="Loading administration data..." />;
  if (error && !status) return <ErrorState message={error} onRetry={loadAdminData} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <Badge variant="rose" icon={<Shield className="w-3.5 h-3.5" />}>
            System Administration
          </Badge>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">Admin Operations & Monitoring</h2>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-mono">Total Users</CardTitle>
            <Users className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <h3 className="text-2xl font-bold text-slate-100">{status?.user_count ?? 0}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-mono">MongoDB Health</CardTitle>
            <Database className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <h3 className={`text-2xl font-bold ${status?.database_connected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {status?.database_connected ? 'Connected' : 'Unavailable'}
            </h3>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3 text-slate-200">{u.full_name}</td>
                    <td className="p-3 text-slate-400">{u.email}</td>
                    <td className="p-3">
                      <select
                        aria-label={`Role for ${u.email}`}
                        value={u.role}
                        onChange={(event) => void updateRole(u.id, event.target.value as AdminUser['role'])}
                        className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                      >
                        <option value="learner">learner</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
