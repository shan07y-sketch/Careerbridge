/**
 * Mobile Network — connections, incoming requests, and people discovery.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { NetworkService } from '../../../services';
import type { NetworkConnection } from '../../../services';
import type { Student } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, Card, Segmented, SkeletonList, EmptyState, ErrorState, PullToRefresh, Button, Avatar } from '../../components';

type Tab = 'connections' | 'requests' | 'discover';

const MobileNetwork: React.FC = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('connections');
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [peers, setPeers] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [c, p] = await Promise.allSettled([NetworkService.getConnections(), NetworkService.getPeers()]);
    if (c.status === 'fulfilled') setConnections(c.value);
    if (p.status === 'fulfilled') setPeers(p.value);
    if (c.status === 'rejected' && p.status === 'rejected') {
      setError(c.reason instanceof Error ? c.reason.message : 'Request failed');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const accepted = connections.filter(c => c.status === 'ACCEPTED');
  const incoming = connections.filter(c => c.status === 'PENDING' && c.direction === 'incoming');
  const connectedIds = new Set(connections.map(c => c.counterpart.id));
  const discover = peers.filter(p => !connectedIds.has(p.id));

  const respond = async (id: string, accept: boolean) => {
    try {
      if (accept) await NetworkService.acceptConnection(id);
      else await NetworkService.declineConnection(id);
      showToast(accept ? 'Connection accepted' : 'Request declined');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  };

  const connect = async (studentProfileId: string) => {
    try {
      await NetworkService.requestConnection(studentProfileId);
      showToast('Connection request sent');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send request', 'error');
    }
  };

  return (
    <MobileShell title="Network" subtitle={`${accepted.length} connections`}>
      <div className="px-4 pt-3">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'connections', label: 'Connections' },
            { value: 'requests', label: incoming.length ? `Requests (${incoming.length})` : 'Requests' },
            { value: 'discover', label: 'Discover' },
          ]}
        />
      </div>

      {loading ? (
        <SkeletonList count={5} itemClass="h-16" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      ) : (
        <div className="px-4 pt-3">
          <PullToRefresh onRefresh={load}>
            {tab === 'connections' && (
              accepted.length === 0 ? (
                <EmptyState icon="group" title="No connections yet" hint="Discover peers and grow your professional network." />
              ) : (
                <div className="space-y-2.5">
                  {accepted.map(c => (
                    <Card key={c.id}>
                      <div className="flex items-center gap-3">
                        <Avatar src={c.counterpart.avatarUrl} name={c.counterpart.name} size={44} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{c.counterpart.name}</p>
                          <p className="text-xs text-on-surface-variant">{c.counterpart.role || 'Student'}</p>
                        </div>
                        <span className="material-symbols-outlined text-success" aria-label="Connected">how_to_reg</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}

            {tab === 'requests' && (
              incoming.length === 0 ? (
                <EmptyState icon="person_add" title="No pending requests" hint="Incoming connection requests will appear here." />
              ) : (
                <div className="space-y-2.5">
                  {incoming.map(c => (
                    <Card key={c.id}>
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar src={c.counterpart.avatarUrl} name={c.counterpart.name} size={44} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{c.counterpart.name}</p>
                          <p className="text-xs text-on-surface-variant">{c.counterpart.role || 'Student'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button full onClick={() => respond(c.id, true)}>Accept</Button>
                        <Button full variant="outline" onClick={() => respond(c.id, false)}>Decline</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}

            {tab === 'discover' && (
              discover.length === 0 ? (
                <EmptyState icon="travel_explore" title="No suggestions right now" hint="Check back later for new people to connect with." />
              ) : (
                <div className="space-y-2.5">
                  {discover.slice(0, 30).map(p => (
                    <Card key={p.id}>
                      <div className="flex items-center gap-3">
                        <Avatar src={p.profilePicture} name={p.name} size={44} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{p.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">{p.university || p.careerGoal || 'Student'}</p>
                        </div>
                        <button onClick={() => connect(p.id)} aria-label={`Connect with ${p.name}`} className="m-press h-9 px-4 rounded-full bg-primary-container text-on-primary-container text-xs font-bold">
                          Connect
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}
          </PullToRefresh>
        </div>
      )}
    </MobileShell>
  );
};

export default MobileNetwork;
